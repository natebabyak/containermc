package tui

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"
	"containermc/internal/core"
	corefake "containermc/internal/core/fake"
	"containermc/internal/events"
	"containermc/internal/spec"
	"github.com/charmbracelet/x/ansi"
)

var update = flag.Bool("update", false, "update TUI snapshots")

func fixture(t *testing.T) *Model {
	t.Helper()
	ctx, c := context.WithCancel(context.Background())
	t.Cleanup(c)
	s := corefake.New(t.TempDir())
	m := New(ctx, s)
	v := spec.Defaults()
	v.ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV"
	v.Network.Port = 25565
	m.servers = []spec.Record{{Spec: v, Status: spec.Status{ContainerID: "test-container", State: "running"}}}
	m.preflight = core.Preflight{Checks: []core.Check{{Name: "Docker", Level: "pass", Detail: "Docker Desktop 29 · API 1.56 · linux/arm64"}}}
	m.viewport.SetWidth(74)
	m.viewport.SetHeight(8)
	m.Update(tea.WindowSizeMsg{Width: 80, Height: 24})
	m.refreshTable()
	return m
}
func key(s string) tea.KeyPressMsg {
	switch s {
	case "enter":
		return tea.KeyPressMsg{Code: tea.KeyEnter}
	case "esc":
		return tea.KeyPressMsg{Code: tea.KeyEscape}
	case "up":
		return tea.KeyPressMsg{Code: tea.KeyUp}
	case "down":
		return tea.KeyPressMsg{Code: tea.KeyDown}
	case "tab":
		return tea.KeyPressMsg{Code: tea.KeyTab}
	case "space":
		return tea.KeyPressMsg{Code: ' ', Text: " "}
	case "ctrl+s":
		return tea.KeyPressMsg{Code: 's', Mod: tea.ModCtrl}
	}
	return tea.KeyPressMsg{Code: rune(s[0]), Text: s}
}

func TestCreateFromSingleForm(t *testing.T) {
	m := fixture(t)
	m.servers = nil
	m.screen = listScreen
	m.Update(key("n"))
	if m.screen != createScreen {
		t.Fatal("did not open create form")
	}
	_, cmd := m.Update(key("ctrl+s"))
	if cmd != nil || m.busy || !strings.Contains(m.create.err, "eula") {
		t.Fatal("creation must require explicit EULA acceptance")
	}
	m.Update(key("space"))
	_, cmd = m.Update(key("ctrl+s"))
	if cmd == nil || !m.busy || m.screen != createScreen {
		t.Fatal("creation should run asynchronously on this screen")
	}
	if _, again := m.Update(key("ctrl+s")); again != nil {
		t.Fatal("duplicate submission while busy")
	}
	m.Update(cmd())
	r, ok := m.selected()
	if m.screen != detailScreen || !ok || r.Status.State != "running" {
		t.Fatalf("creation did not reach the new server: %#v", r)
	}
	rows, err := m.service.List(m.ctx)
	if err != nil || len(rows) != 1 {
		t.Fatal(rows, err)
	}
}

func TestFailedCreateCanRetryWithoutDuplicate(t *testing.T) {
	m := fixture(t)
	m.servers = nil
	m.screen = listScreen
	s := m.service.(*corefake.Service)
	s.Runtime.Failures["EnsureImage"] = fmt.Errorf("registry unavailable")
	m.Update(key("n"))
	m.Update(key("ctrl+s"))
	m.Update(key("space"))
	_, cmd := m.Update(key("ctrl+s"))
	m.Update(cmd())
	if m.screen != createScreen || m.create.saved == nil || !strings.Contains(m.create.err, "registry unavailable") {
		t.Fatal("failed attempt was not preserved on the form")
	}
	id := m.create.saved.Spec.ID
	port := m.create.saved.Spec.Network.Port
	delete(s.Runtime.Failures, "EnsureImage")
	m.create.inputs[0].SetValue("Retried server")
	_, cmd = m.Update(key("ctrl+s"))
	m.Update(cmd())
	rows, err := m.service.List(m.ctx)
	if err != nil || len(rows) != 1 {
		t.Fatal("retry duplicated the server", rows, err)
	}
	if rows[0].Spec.ID != id || rows[0].Spec.Network.Port != port || rows[0].Spec.Name != "Retried server" || rows[0].Status.State != "running" {
		t.Fatal("retry did not preserve and update server", rows)
	}
}

func TestInvalidVersionStaysOnCreateForm(t *testing.T) {
	m := fixture(t)
	m.screen = listScreen
	m.Update(key("n"))
	m.create.inputs[1].SetValue("bad version")
	m.create.accepted = true
	m.Update(key("ctrl+s"))
	if m.busy || m.screen != createScreen || m.create.focus != 1 || m.create.err == "" {
		t.Fatal("invalid version was not shown inline")
	}
}

func TestViewsFitTerminal(t *testing.T) {
	for _, size := range [][2]int{{52, 20}, {80, 24}, {120, 40}} {
		for _, screen := range []screen{listScreen, detailScreen, consoleScreen, createScreen, deleteScreen} {
			m := fixture(t)
			m.screen = screen
			m.create = newCreateForm()
			m.Update(tea.WindowSizeMsg{Width: size[0], Height: size[1]})
			content := m.View().Content
			if height := strings.Count(content, "\n") + 1; height > size[1] {
				t.Fatalf("screen %d height %d exceeds %d", screen, height, size[1])
			}
			for _, line := range strings.Split(content, "\n") {
				if ansi.StringWidth(line) > size[0] {
					t.Fatalf("screen %d width exceeds %d: %q", screen, size[0], ansi.Strip(line))
				}
			}
		}
	}
}
func TestViews(t *testing.T) {
	for _, tc := range []struct {
		name   string
		screen screen
	}{{"preflight", preflightScreen}, {"list", listScreen}, {"detail", detailScreen}, {"console", consoleScreen}, {"delete", deleteScreen}, {"create", createScreen}} {
		t.Run(tc.name, func(t *testing.T) {
			m := fixture(t)
			m.screen = tc.screen
			if tc.screen == consoleScreen {
				m.appendLines("[INFO] Server ready", "[WARN] Slow tick")
			}
			if tc.screen == createScreen {
				m.create = newCreateForm()
				m.create.seed.ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV"
				m.create.setWidth(m.contentWidth())
				m.create.inputs[0].Focus()
			}
			got := ansi.Strip(m.View().Content)
			path := filepath.Join("testdata", tc.name+".txt")
			if *update {
				_ = os.MkdirAll("testdata", 0755)
				if e := os.WriteFile(path, []byte(got), 0644); e != nil {
					t.Fatal(e)
				}
			}
			want, e := os.ReadFile(path)
			if e != nil {
				t.Fatal(e)
			}
			if string(want) != got {
				t.Fatalf("view changed: %s; review with -update", path)
			}
		})
	}
}
func TestNavigationAndBlockingPreflight(t *testing.T) {
	m := fixture(t)
	m.preflight.Checks = append(m.preflight.Checks, core.Check{Level: "fail"})
	m.Update(key("enter"))
	if m.screen != preflightScreen {
		t.Fatal("blocking check bypassed")
	}
	m.preflight.Checks = m.preflight.Checks[:1]
	m.Update(key("enter"))
	if m.screen != listScreen {
		t.Fatal("could not continue")
	}
	m.Update(key("enter"))
	if m.screen != detailScreen {
		t.Fatal("could not open detail")
	}
	m.Update(key("esc"))
	m.Update(key("n"))
	if m.screen != createScreen {
		t.Fatal("create form not opened")
	}
	m.Update(key("esc"))
	if m.screen != listScreen || m.create != nil {
		t.Fatal("create form cancellation failed")
	}
}
func TestConsoleBufferHistoryAndStaleMessages(t *testing.T) {
	m := fixture(t)
	m.screen = consoleScreen
	for i := 0; i < maxLines+100; i++ {
		m.lines = append(m.lines, fmt.Sprint(i))
	}
	m.appendLines("last")
	if len(m.lines) != maxLines {
		t.Fatal(len(m.lines))
	}
	m.filter = "last"
	m.renderLogs()
	if !strings.Contains(ansi.Strip(m.viewport.View()), "last") {
		t.Fatal("filter failed")
	}
	m.history = []string{"list", "say hi"}
	m.historyIndex = 2
	m.consoleKey(key("up"))
	if m.input.Value() != "say hi" {
		t.Fatal("history failed")
	}
	m.consoleKey(key("down"))
	if m.input.Value() != "" {
		t.Fatal("history did not return to empty")
	}
	before := len(m.lines)
	m.Update(logBatchMsg{Seq: m.logSeq - 1, Lines: []core.LogLine{{Text: "stale"}}})
	if len(m.lines) != before {
		t.Fatal("stale stream changed view")
	}
	ctx, c := context.WithCancel(context.Background())
	m.logCancel = c
	m.consoleKey(key("esc"))
	if ctx.Err() == nil {
		t.Fatal("leaving console did not cancel stream")
	}
}
func TestLiveStats(t *testing.T) {
	m := fixture(t)
	id := m.servers[0].Spec.ID
	m.Update(events.Event{Kind: events.Metrics, ServerID: id, Stats: core.Stats{CPUPercent: 42}})
	if m.stats[id].CPUPercent != 42 {
		t.Fatal("stats not applied")
	}
}

func TestConsoleCommand(t *testing.T) {
	m := fixture(t)
	s := m.service.(*corefake.Service)
	v := spec.Defaults()
	v.EULA = true
	r, e := s.CreateServer(m.ctx, v)
	if e != nil {
		t.Fatal(e)
	}
	m.servers = []spec.Record{r}
	m.screen = consoleScreen
	m.input.SetValue("say hi")
	cmd := m.consoleKey(key("enter"))
	if cmd == nil || !m.busy {
		t.Fatal("command was not scheduled")
	}
	m.Update(cmd())
	if m.busy || !strings.Contains(strings.Join(m.lines, "\n"), "Executed: say hi") {
		t.Fatal("command result not rendered", m.lines)
	}
	stream, e := s.Logs(m.ctx, v.ID, false)
	if e != nil {
		t.Fatal(e)
	}
	found := false
	for line := range stream {
		if strings.Contains(line.Text, "[Server] hi") {
			found = true
		}
	}
	if !found {
		t.Fatal("chat line not logged")
	}
}
