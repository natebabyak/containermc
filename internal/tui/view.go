package tui

import (
	"fmt"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

func (m *Model) contentWidth() int { return max(20, min(96, m.width-4)-6) }
func (m *Model) View() tea.View {
	if m.width < 52 || m.height < 20 {
		v := tea.NewView(accentStyle.Bold(true).Render("ContainerMC") + "\n\nPlease resize to at least 52 × 20.\nCtrl+C to quit.")
		v.AltScreen = true
		return v
	}
	section := "Servers"
	body := ""
	footer := ""
	switch m.screen {
	case preflightScreen:
		section = "Connection"
		body = m.preflightView()
		footer = keyHint("r", "retry") + "   " + keyHint("esc", "back") + "   " + keyHint("q", "quit")
	case listScreen:
		body = m.serversView()
		footer = keyHint("n", "new") + "   " + keyHint("enter", "open") + "   " + keyHint("c", "console") + "   " + keyHint("p", "connection") + "   " + keyHint("q", "quit")
	case createScreen:
		section = "New server"
		body = m.create.view()
		footer = keyHint("tab", "next") + "   " + keyHint("space", "toggle") + "   " + keyHint("ctrl+s", "create") + "   " + keyHint("esc", "back")
	case detailScreen:
		section = "Server"
		body = m.serverView()
		footer = keyHint("s", "start") + "   " + keyHint("x", "stop") + "   " + keyHint("r", "restart") + "   " + keyHint("c", "console") + "   " + keyHint("d", "delete") + "   " + keyHint("esc", "back")
	case deleteScreen:
		section = "Delete server"
		body = m.deleteView()
		footer = keyHint("k", "keep world") + "   " + keyHint("d", "delete world") + "   " + keyHint("esc", "cancel")
	case consoleScreen:
		section = "Console"
		body = m.consoleView()
		footer = keyHint("enter", "send") + "   " + keyHint("ctrl+f", "follow") + "   " + keyHint("ctrl+s", "filter") + "   " + keyHint("esc", "back")
	}
	inner := m.contentWidth()
	outer := inner + 6
	title := accentStyle.Bold(true).Render("▣ ContainerMC")
	breadcrumb := mutedStyle.Render(section)
	header := title + strings.Repeat(" ", max(2, outer-lipgloss.Width(title)-lipgloss.Width(breadcrumb))) + breadcrumb
	footer = lipgloss.NewStyle().Width(outer).Render(footer)
	if m.busy {
		if m.screen == createScreen {
			body = headingStyle.Render("Creating "+clean(m.create.inputs[0].Value())) + "\n\n" + mutedStyle.Render("Minecraft "+clean(m.create.inputs[1].Value())+" · Vanilla")
		}
		body += "\n\n" + m.spinner.View() + " " + labelStyle.Render(clean(m.message))
		footer = mutedStyle.Render("Working…  Ctrl+C to quit; the server stays in Docker.")
	} else if m.message != "" && m.screen != consoleScreen && m.screen != createScreen {
		body += "\n\n" + mutedStyle.Render(clean(m.message))
	}
	m.page.SetHeight(max(4, m.height-lipgloss.Height(header)-lipgloss.Height(footer)-6))
	m.page.SetContent(lipgloss.NewStyle().Width(inner).Render(body))
	content := m.page.View()
	frame := lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(borderColor).Padding(0, 2).Render(content)
	layout := header + "\n\n" + frame + "\n" + footer
	v := tea.NewView(lipgloss.Place(m.width, m.height, lipgloss.Center, lipgloss.Center, layout))
	v.AltScreen = true
	return v
}
func keyHint(key, action string) string {
	return accentStyle.Render(key) + " " + mutedStyle.Render(action)
}
func (m *Model) preflightView() string {
	if len(m.preflight.Checks) == 0 {
		return headingStyle.Render("Connecting to Docker") + "\n\n" + mutedStyle.Render("Start Docker Desktop or Docker Engine to continue.")
	}
	var b strings.Builder
	b.WriteString(headingStyle.Render("Docker connection") + "\n\n")
	for _, c := range m.preflight.Checks {
		style := accentStyle
		symbol := "✓"
		if c.Level == "warn" {
			style = warningStyle
			symbol = "!"
		}
		if c.Level == "fail" {
			style = errorStyle
			symbol = "×"
		}
		b.WriteString(style.Render(symbol+" "+c.Name) + "\n" + mutedStyle.Render(clean(c.Detail)) + "\n")
		if c.Level == "fail" {
			b.WriteString(labelStyle.Render(c.Hint) + "\n")
			if c.URL != "" {
				b.WriteString(mutedStyle.Render(c.URL) + "\n")
			}
		}
		b.WriteString("\n")
	}
	return b.String()
}
func (m *Model) consoleView() string {
	r, ok := m.selected()
	if !ok {
		return "No server selected."
	}
	following := "paused"
	if m.follow {
		following = "following"
	}
	heading := headingStyle.Render(clean(r.Spec.Name)) + "  " + statusBadge(r.Status.State) + "  " + mutedStyle.Render(following)
	if m.filter != "" {
		heading += "\n" + mutedStyle.Render("Filter: "+clean(m.filter))
	}
	return fmt.Sprintf("%s\n\n%s\n\n%s", heading, m.viewport.View(), m.input.View())
}
