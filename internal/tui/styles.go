package tui

import (
	"charm.land/bubbles/v2/textinput"
	"charm.land/lipgloss/v2"
)

var (
	accentColor       = lipgloss.Color("#80DEAE")
	textColor         = lipgloss.Color("#DEE6EE")
	mutedColor        = lipgloss.Color("#8391A5")
	borderColor       = lipgloss.Color("#3C4C5C")
	selectedColor     = lipgloss.Color("#203C33")
	accentStyle       = lipgloss.NewStyle().Foreground(accentColor)
	mutedStyle        = lipgloss.NewStyle().Foreground(mutedColor)
	labelStyle        = lipgloss.NewStyle().Foreground(textColor)
	headingStyle      = labelStyle.Bold(true)
	errorStyle        = lipgloss.NewStyle().Foreground(lipgloss.Color("#F48D92"))
	warningStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("#E9CA7A"))
	buttonStyle       = lipgloss.NewStyle().Foreground(textColor).Background(borderColor).Padding(0, 1)
	activeButtonStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("#10271C")).Background(accentColor).Bold(true).Padding(0, 1)
)

func inputStyles() textinput.Styles {
	styles := textinput.DefaultStyles(true)
	styles.Focused.Prompt = accentStyle
	styles.Focused.Text = labelStyle
	styles.Blurred.Prompt = mutedStyle
	styles.Blurred.Text = labelStyle
	styles.Focused.Placeholder = mutedStyle
	styles.Blurred.Placeholder = mutedStyle
	styles.Cursor.Color = accentColor
	return styles
}

func statusBadge(state string) string {
	style := mutedStyle
	switch state {
	case "running", "ready":
		style = accentStyle
	case "missing", "drifted", "restarting", "created":
		style = warningStyle
	case "dead", "crashed":
		style = errorStyle
	}
	return style.Render("● " + state)
}
