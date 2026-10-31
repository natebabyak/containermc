package tui

import (
	"strings"

	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
	"containermc/internal/spec"
)

// Creation is one form. LAN access and EULA acceptance are enabled by default.
type createForm struct {
	inputs   []textinput.Model
	focus    int
	accepted bool
	seed     spec.Server
	saved    *spec.Record
	err      string
}

func newCreateForm() *createForm {
	s := spec.Defaults()
	f := &createForm{seed: s, accepted: s.EULA, inputs: make([]textinput.Model, 2)}
	for i, value := range []string{s.Name, s.Version} {
		input := textinput.New()
		input.SetStyles(inputStyles())
		input.SetValue(value)
		input.CharLimit = 64
		input.Prompt = "› "
		f.inputs[i] = input
	}
	f.inputs[1].CharLimit = 32
	return f
}
func (f *createForm) setWidth(width int) {
	for i := range f.inputs {
		f.inputs[i].SetWidth(max(10, width-4))
	}
}
func (f *createForm) focusField(index int) tea.Cmd {
	f.focus = (index + 4) % 4
	for i := range f.inputs {
		f.inputs[i].Blur()
	}
	if f.focus < len(f.inputs) {
		return f.inputs[f.focus].Focus()
	}
	return nil
}
func (f *createForm) updateInput(msg tea.Msg) tea.Cmd {
	if f.focus >= len(f.inputs) {
		return nil
	}
	var cmd tea.Cmd
	f.inputs[f.focus], cmd = f.inputs[f.focus].Update(msg)
	return cmd
}
func (f *createForm) server() (spec.Server, error) {
	s := f.seed
	s.Name = strings.TrimSpace(f.inputs[0].Value())
	s.Version = strings.TrimSpace(f.inputs[1].Value())
	s.EULA = f.accepted
	if f.saved != nil {
		s.Network.Port = f.saved.Spec.Network.Port
	}
	return s, spec.Validate(s)
}
func (m *Model) createKey(msg tea.KeyPressMsg) tea.Cmd {
	if m.busy {
		return nil
	}
	switch msg.String() {
	case "esc":
		m.create = nil
		m.screen = listScreen
		m.message = ""
		m.page.GotoTop()
		return nil
	case "tab", "down":
		return m.create.focusField(m.create.focus + 1)
	case "shift+tab", "up":
		return m.create.focusField(m.create.focus - 1)
	case "pgup", "pgdown":
		var cmd tea.Cmd
		m.page, cmd = m.page.Update(msg)
		return cmd
	case "ctrl+s":
		return m.submitCreate()
	case "space":
		if m.create.focus == 2 {
			m.create.accepted = !m.create.accepted
			m.create.err = ""
			return nil
		}
	case "enter":
		switch m.create.focus {
		case 0, 1:
			return m.create.focusField(m.create.focus + 1)
		case 2:
			m.create.accepted = !m.create.accepted
			return m.create.focusField(3)
		case 3:
			return m.submitCreate()
		}
	}
	return m.create.updateInput(msg)
}
func (m *Model) submitCreate() tea.Cmd {
	s, err := m.create.server()
	if err != nil {
		m.create.err = err.Error()
		if errors, ok := err.(spec.ValidationErrors); ok {
			for _, e := range errors {
				switch e.Field {
				case "name":
					return m.create.focusField(0)
				case "version":
					return m.create.focusField(1)
				case "eula":
					return m.create.focusField(2)
				}
			}
		}
		return nil
	}
	// A failed pull/create may already have a cached row and reserved port. Retry
	// that identity via Apply, rather than making a second server or failing "exists".
	saved := m.create.saved
	m.busy = true
	m.create.err = ""
	m.message = "Preparing the Minecraft server…"
	return func() tea.Msg {
		if saved == nil {
			r, e := m.service.CreateServer(m.ctx, s)
			return createResultMsg{Record: r, Err: e}
		}
		if e := m.service.UpdateSpec(m.ctx, s); e != nil {
			return createResultMsg{Record: *saved, Err: e}
		}
		if e := m.service.Apply(m.ctx, s.ID); e != nil {
			return createResultMsg{Record: spec.Record{Spec: s}, Err: e}
		}
		rows, e := m.service.List(m.ctx)
		if e != nil {
			return createResultMsg{Record: spec.Record{Spec: s}, Err: e}
		}
		for _, r := range rows {
			if r.Spec.ID == s.ID {
				return createResultMsg{Record: r}
			}
		}
		return createResultMsg{Record: spec.Record{Spec: s}}
	}
}

func (f *createForm) view() string {
	var b strings.Builder
	b.WriteString(headingStyle.Render("New server") + "\n" + mutedStyle.Render("A name, a version, and you're ready to play.") + "\n\n")
	if f.err != "" {
		b.WriteString(errorStyle.Render("Couldn't create the server\n"+clean(f.err)) + "\n\n")
	}
	for i, label := range []string{"Server name", "Minecraft version"} {
		style := labelStyle
		if f.focus == i {
			style = accentStyle.Bold(true)
		}
		b.WriteString(style.Render(label) + "\n" + f.inputs[i].View() + "\n\n")
	}
	b.WriteString(mutedStyle.Render("Vanilla · 2 GiB memory · automatic port · LAN access") + "\n\n")
	checkbox := "○"
	if f.accepted {
		checkbox = "●"
	}
	eula := checkbox + " I accept Minecraft's EULA"
	if f.focus == 2 {
		eula = accentStyle.Render("› " + eula)
	} else {
		eula = labelStyle.Render("  " + eula)
	}
	b.WriteString(eula + "\n" + mutedStyle.Render("  https://aka.ms/MinecraftEULA") + "\n\n")
	button := " Create server "
	if f.saved != nil {
		button = " Retry creation "
	}
	style := buttonStyle
	if f.focus == 3 {
		style = activeButtonStyle
	}
	b.WriteString(style.Render(button))
	return b.String()
}
