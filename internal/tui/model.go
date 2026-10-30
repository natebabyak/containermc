package tui

import (
	"context"
	"fmt"
	"strings"
	"time"

	"charm.land/bubbles/v2/spinner"
	"charm.land/bubbles/v2/table"
	"charm.land/bubbles/v2/textinput"
	"charm.land/bubbles/v2/viewport"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"containermc/internal/core"
	"containermc/internal/events"
	"containermc/internal/spec"
	"github.com/charmbracelet/x/ansi"
)

type screen int

const (
	preflightScreen screen = iota
	listScreen
	detailScreen
	consoleScreen
	createScreen
	deleteScreen
)
const maxLines = 5000

type preflightMsg struct {
	Result core.Preflight
	Err    error
}
type listMsg struct {
	Records []spec.Record
	Err     error
}
type resultMsg struct {
	ID, Text string
	Err      error
}
type createResultMsg struct {
	Record spec.Record
	Err    error
}
type logStartMsg struct {
	Seq    int
	Stream <-chan core.LogLine
	Err    error
}
type logBatchMsg struct {
	Seq    int
	Lines  []core.LogLine
	Stream <-chan core.LogLine
	Done   bool
}

type Model struct {
	service               core.Service
	ctx                   context.Context
	screen                screen
	preflight             core.Preflight
	startup               bool
	servers               []spec.Record
	cursor, width, height int
	stats                 map[string]core.Stats
	message               string
	busy                  bool
	create                *createForm
	table                 table.Model
	spinner               spinner.Model
	input                 textinput.Model
	viewport, page        viewport.Model
	lines, history        []string
	historyIndex          int
	follow, searching     bool
	filter                string
	logCancel             context.CancelFunc
	logSeq                int
	selectID              string
}

func New(ctx context.Context, s core.Service) *Model {
	input := textinput.New()
	input.SetStyles(inputStyles())
	input.Placeholder = "Type a command, e.g. list or say hi"
	input.CharLimit = 2048
	loading := spinner.New(spinner.WithSpinner(spinner.MiniDot))
	loading.Style = accentStyle
	m := &Model{service: s, ctx: ctx, screen: preflightScreen, startup: true, stats: map[string]core.Stats{}, input: input, table: table.New(table.WithFocused(true)), spinner: loading, viewport: viewport.New(), page: viewport.New(), follow: true}
	m.table.SetStyles(table.Styles{Header: mutedStyle.Bold(true).Padding(0, 1), Cell: lipgloss.NewStyle().Padding(0, 1), Selected: lipgloss.NewStyle().Foreground(textColor).Background(selectedColor).Bold(true)})
	m.resize(80, 24)
	return m
}
func (m *Model) Init() tea.Cmd { return tea.Batch(m.check(), m.spinner.Tick) }
func (m *Model) resize(width, height int) {
	m.width = width
	m.height = height
	inner := m.contentWidth()
	m.page.SetWidth(inner)
	m.page.SetHeight(max(4, height-9))
	m.viewport.SetWidth(inner)
	m.viewport.SetHeight(max(3, height-16))
	m.input.SetWidth(max(10, inner-4))
	m.table.SetColumns([]table.Column{{Title: "SERVER", Width: max(12, inner-42)}, {Title: "VERSION", Width: 9}, {Title: "STATE", Width: 12}, {Title: "PORT", Width: 6}})
	m.table.SetWidth(inner)
	m.table.SetHeight(max(3, height-16))
	if m.create != nil {
		m.create.setWidth(inner)
	}
}
func (m *Model) check() tea.Cmd {
	m.busy = true
	m.message = "Checking Docker…"
	return func() tea.Msg {
		ctx, cancel := context.WithTimeout(m.ctx, 15*time.Second)
		defer cancel()
		p, e := m.service.Preflight(ctx)
		if e == nil && p.OK() {
			e = m.service.Reconcile(ctx)
		}
		if e != nil {
			p.Checks = append(p.Checks, core.Check{Name: "Server discovery", Level: "fail", Detail: e.Error(), Hint: "Resolve the Docker error and retry."})
		}
		return preflightMsg{p, e}
	}
}
func (m *Model) load() tea.Cmd {
	return func() tea.Msg { rows, e := m.service.List(m.ctx); return listMsg{rows, e} }
}
func (m *Model) selected() (spec.Record, bool) {
	if m.cursor < 0 || m.cursor >= len(m.servers) {
		return spec.Record{}, false
	}
	return m.servers[m.cursor], true
}
func (m *Model) refreshTable() {
	rows := make([]table.Row, 0, len(m.servers))
	for _, r := range m.servers {
		state := r.Status.State
		if r.Status.Flag != "" {
			state = r.Status.Flag
		}
		rows = append(rows, table.Row{clean(r.Spec.Name), r.Spec.Version, state, fmt.Sprint(r.Spec.Network.Port)})
	}
	m.table.SetRows(rows)
	m.table.SetCursor(m.cursor)
}
func (m *Model) operation(name, id string, fn func(context.Context) error) tea.Cmd {
	m.busy = true
	m.message = name + "…"
	return func() tea.Msg { return resultMsg{ID: id, Text: name + " complete", Err: fn(m.ctx)} }
}

func (m *Model) leaveConsole() {
	if m.logCancel != nil {
		m.logCancel()
		m.logCancel = nil
	}
	m.logSeq++
}
func (m *Model) openConsole(id string) tea.Cmd {
	m.leaveConsole()
	m.screen = consoleScreen
	m.lines = nil
	m.filter = ""
	m.follow = true
	m.searching = false
	m.input.SetValue("")
	ctx, c := context.WithCancel(m.ctx)
	m.logCancel = c
	seq := m.logSeq
	return tea.Batch(m.input.Focus(), func() tea.Msg { stream, e := m.service.Logs(ctx, id, true); return logStartMsg{seq, stream, e} })
}
func collectLogs(ctx context.Context, seq int, ch <-chan core.LogLine) tea.Cmd {
	return func() tea.Msg {
		batch := logBatchMsg{Seq: seq, Stream: ch}
		timer := time.NewTimer(50 * time.Millisecond)
		defer timer.Stop()
		for len(batch.Lines) < 512 {
			select {
			case line, ok := <-ch:
				if !ok {
					batch.Done = true
					return batch
				}
				batch.Lines = append(batch.Lines, line)
			case <-timer.C:
				return batch
			case <-ctx.Done():
				batch.Done = true
				return batch
			}
		}
		return batch
	}
}
func (m *Model) appendLines(lines ...string) {
	m.lines = append(m.lines, lines...)
	if len(m.lines) > maxLines {
		m.lines = append([]string{}, m.lines[len(m.lines)-maxLines:]...)
	}
	m.renderLogs()
}
func clean(s string) string {
	return strings.Map(func(r rune) rune {
		if r < 32 && r != '\t' {
			return -1
		}
		if r == 127 {
			return -1
		}
		return r
	}, ansi.Strip(s))
}
func (m *Model) renderLogs() {
	visible := make([]string, 0, len(m.lines))
	for _, l := range m.lines {
		if m.filter == "" || strings.Contains(strings.ToLower(l), strings.ToLower(m.filter)) {
			display := l
			switch {
			case strings.Contains(l, "ERROR"):
				display = lipgloss.NewStyle().Foreground(lipgloss.Color("#F07D7D")).Render(l)
			case strings.Contains(l, "WARN"):
				display = lipgloss.NewStyle().Foreground(lipgloss.Color("#E7CA74")).Render(l)
			}
			visible = append(visible, display)
		}
	}
	m.viewport.SetContent(strings.Join(visible, "\n"))
	if m.follow {
		m.viewport.GotoBottom()
	}
}

func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch v := msg.(type) {
	case tea.WindowSizeMsg:
		m.resize(v.Width, v.Height)
		return m, nil
	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(v)
		return m, cmd
	case preflightMsg:
		m.busy = false
		m.preflight = v.Result
		m.message = ""
		if m.startup && v.Result.OK() {
			m.screen = listScreen
		}
		m.startup = false
		if v.Err != nil {
			m.message = v.Err.Error()
		}
		return m, m.load()
	case listMsg:
		if v.Err != nil {
			m.message = v.Err.Error()
			return m, nil
		}
		selected, _ := m.selected()
		m.servers = v.Records
		for i, r := range m.servers {
			if r.Spec.ID == m.selectID || (m.selectID == "" && r.Spec.ID == selected.Spec.ID) {
				m.cursor = i
				m.selectID = ""
				break
			}
		}
		m.cursor = max(0, min(m.cursor, len(m.servers)-1))
		m.refreshTable()
		return m, nil
	case resultMsg:
		m.busy = false
		m.selectID = v.ID
		m.message = v.Text
		if v.Err != nil {
			m.message = v.Err.Error()
		}
		if m.screen == consoleScreen {
			m.appendLines(clean(m.message))
		}
		return m, m.load()
	case createResultMsg:
		m.busy = false
		if m.create == nil {
			return m, nil
		}
		if v.Err != nil {
			m.create.err = v.Err.Error()
			m.message = ""
			if v.Record.Spec.ID != "" {
				m.create.saved = &v.Record
			}
			return m, m.load()
		}
		m.selectID = v.Record.Spec.ID
		found := false
		for i, r := range m.servers {
			if r.Spec.ID == v.Record.Spec.ID {
				m.servers[i] = v.Record
				m.cursor = i
				found = true
				break
			}
		}
		if !found {
			m.servers = append(m.servers, v.Record)
			m.cursor = len(m.servers) - 1
		}
		m.refreshTable()
		m.create = nil
		m.screen = detailScreen
		m.page.GotoTop()
		m.message = "Server created. Open the console to watch Minecraft start."
		return m, m.load()
	case events.Event:
		if v.Kind == events.Progress {
			m.message = v.Message
			if strings.HasPrefix(m.message, "Pulling ") || strings.Contains(m.message, "Pulling from") {
				m.message = "Downloading the Minecraft image…"
			} else if fields := strings.Fields(m.message); len(fields) > 1 && len(fields[0]) == 12 {
				m.message = strings.Join(fields[1:], " ")
			}
			return m, nil
		}
		if v.Kind == events.Metrics {
			m.stats[v.ServerID] = v.Stats
			return m, nil
		}
		if v.Message != "" {
			m.message = v.Message
		}
		return m, m.load()
	case logStartMsg:
		if v.Seq != m.logSeq {
			return m, nil
		}
		if v.Err != nil {
			m.message = v.Err.Error()
			return m, nil
		}
		return m, collectLogs(m.ctx, v.Seq, v.Stream)
	case logBatchMsg:
		if v.Seq != m.logSeq || m.screen != consoleScreen {
			return m, nil
		}
		lines := make([]string, 0, len(v.Lines))
		for _, l := range v.Lines {
			if l.Err != nil {
				lines = append(lines, "Stream: "+clean(l.Err.Error()))
			} else {
				lines = append(lines, clean(l.Text))
			}
		}
		m.appendLines(lines...)
		if !v.Done {
			return m, collectLogs(m.ctx, v.Seq, v.Stream)
		}
		return m, nil
	case tea.KeyPressMsg:
		key := v.String()
		if key == "ctrl+c" {
			m.leaveConsole()
			return m, tea.Quit
		}
		if m.screen == createScreen {
			return m, m.createKey(v)
		}
		if m.screen == consoleScreen {
			return m, m.consoleKey(v)
		}
		if key == "q" {
			return m, tea.Quit
		}
		if m.busy {
			return m, nil
		}
		if m.screen == preflightScreen {
			switch key {
			case "r":
				return m, m.check()
			case "enter", "esc":
				if m.preflight.OK() {
					m.screen = listScreen
					m.page.GotoTop()
				}
			}
			var cmd tea.Cmd
			m.page, cmd = m.page.Update(v)
			return m, cmd
		}
		if m.screen == deleteScreen {
			r, ok := m.selected()
			if !ok {
				m.screen = listScreen
				return m, nil
			}
			switch key {
			case "esc", "n":
				m.screen = detailScreen
			case "k", "d":
				m.screen = listScreen
				return m, m.operation("Delete", r.Spec.ID, func(ctx context.Context) error { return m.service.Delete(ctx, r.Spec.ID, key == "k") })
			}
			return m, nil
		}
		switch key {
		case "esc":
			m.screen = listScreen
			m.page.GotoTop()
			return m, nil
		case "p":
			m.screen = preflightScreen
			m.page.GotoTop()
			return m, m.check()
		case "n":
			if m.preflight.OK() {
				m.create = newCreateForm()
				m.create.setWidth(m.contentWidth())
				m.screen = createScreen
				m.message = ""
				m.page.GotoTop()
				return m, m.create.inputs[0].Focus()
			}
		}
		if m.screen == listScreen {
			switch key {
			case "up", "down", "j", "k", "pgup", "pgdown", "home", "end":
				var cmd tea.Cmd
				m.table, cmd = m.table.Update(v)
				m.cursor = m.table.Cursor()
				return m, cmd
			case "enter":
				if len(m.servers) > 0 {
					m.screen = detailScreen
					m.page.GotoTop()
				}
				return m, nil
			}
		}
		r, ok := m.selected()
		if !ok {
			return m, nil
		}
		id := r.Spec.ID
		switch key {
		case "s":
			return m, m.operation("Start", id, func(c context.Context) error { return m.service.Start(c, id) })
		case "x":
			return m, m.operation("Stop", id, func(c context.Context) error { return m.service.Stop(c, id) })
		case "r":
			return m, m.operation("Restart", id, func(c context.Context) error {
				if e := m.service.Stop(c, id); e != nil {
					return e
				}
				return m.service.Start(c, id)
			})
		case "a":
			return m, m.operation("Apply", id, func(c context.Context) error { return m.service.Apply(c, id) })
		case "d":
			m.screen = deleteScreen
		case "c":
			return m, m.openConsole(id)
		}
		var cmd tea.Cmd
		m.page, cmd = m.page.Update(v)
		return m, cmd
	}
	if m.screen == createScreen && m.create != nil && !m.busy {
		return m, m.create.updateInput(msg)
	}
	if m.screen == consoleScreen {
		var cmd tea.Cmd
		m.input, cmd = m.input.Update(msg)
		return m, cmd
	}
	return m, nil
}

func (m *Model) consoleKey(v tea.KeyPressMsg) tea.Cmd {
	key := v.String()
	if key == "esc" {
		m.leaveConsole()
		m.screen = detailScreen
		return nil
	}
	switch key {
	case "ctrl+f":
		m.follow = !m.follow
		m.renderLogs()
		return nil
	case "ctrl+s":
		m.searching = !m.searching
		m.input.SetValue("")
		if m.searching {
			m.input.Placeholder = "Filter logs; Enter to apply"
		} else {
			m.input.Placeholder = "Minecraft command"
		}
		return nil
	case "pgup", "pgdown":
		m.follow = false
		var cmd tea.Cmd
		m.viewport, cmd = m.viewport.Update(v)
		return cmd
	case "up":
		if len(m.history) > 0 {
			m.historyIndex = max(0, m.historyIndex-1)
			m.input.SetValue(m.history[m.historyIndex])
		}
		return nil
	case "down":
		m.historyIndex = min(len(m.history), m.historyIndex+1)
		if m.historyIndex == len(m.history) {
			m.input.SetValue("")
		} else {
			m.input.SetValue(m.history[m.historyIndex])
		}
		return nil
	case "enter":
		text := m.input.Value()
		m.input.SetValue("")
		if m.searching {
			m.filter = text
			m.searching = false
			m.input.Placeholder = "Minecraft command"
			m.renderLogs()
			return nil
		}
		if strings.TrimSpace(text) == "" || m.busy {
			return nil
		}
		r, ok := m.selected()
		if !ok {
			return nil
		}
		m.history = append(m.history, text)
		if len(m.history) > 100 {
			m.history = m.history[1:]
		}
		m.historyIndex = len(m.history)
		m.appendLines("> " + clean(text))
		m.busy = true
		m.message = "Sending command…"
		return func() tea.Msg {
			out, e := m.service.SendCommand(m.ctx, r.Spec.ID, text)
			return resultMsg{ID: r.Spec.ID, Text: out, Err: e}
		}
	}
	var cmd tea.Cmd
	m.input, cmd = m.input.Update(v)
	return cmd
}

func Run(ctx context.Context, s core.Service) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	p := tea.NewProgram(New(ctx, s), tea.WithContext(ctx))
	stream := s.Subscribe(ctx)
	go func() {
		for e := range stream {
			p.Send(e)
		}
	}()
	_, err := p.Run()
	return err
}
