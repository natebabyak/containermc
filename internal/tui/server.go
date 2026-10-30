package tui

import (
	"fmt"
	"strings"
)

func (m *Model) serverView() string {
	r, ok := m.selected()
	if !ok {
		return mutedStyle.Render("Select a server from the list.")
	}
	var b strings.Builder
	b.WriteString(headingStyle.Render(clean(r.Spec.Name)) + "  " + statusBadge(r.Status.State) + "\n" + mutedStyle.Render(strings.ToLower(r.Spec.Loader)+" · Minecraft "+r.Spec.Version) + "\n\n")
	if r.Status.Flag == "missing" {
		b.WriteString(warningStyle.Render("Container missing. Press a to recreate it with its world.") + "\n\n")
	} else if r.Status.Flag == "drifted" {
		b.WriteString(warningStyle.Render("Settings changed. Press a to apply them.") + "\n\n")
	}
	b.WriteString(mutedStyle.Render("JOIN ON THIS COMPUTER") + "\n" + accentStyle.Bold(true).Render(fmt.Sprintf("localhost:%d", r.Spec.Network.Port)) + "\n\n")
	stats := m.stats[r.Spec.ID]
	b.WriteString(mutedStyle.Render("CPU          MEMORY") + "\n" + labelStyle.Render(fmt.Sprintf("%-12s %.0f / %d MiB", fmt.Sprintf("%.1f%%", stats.CPUPercent), float64(stats.MemoryUsed)/(1<<20), r.Spec.Resources.MemoryMiB)) + "\n\n")
	b.WriteString(buttonStyle.Render(" c  Open console ") + "\n\n" + mutedStyle.Render("Minecraft can take a moment to start. Watch the console for progress."))
	return b.String()
}
func (m *Model) deleteView() string {
	r, ok := m.selected()
	if !ok {
		return "No server selected."
	}
	return errorStyle.Bold(true).Render("Delete "+clean(r.Spec.Name)+"?") + "\n\n" + labelStyle.Render("k  Remove the server and keep its world volume.\nd  Remove the server and permanently delete its world.") + "\n\n" + mutedStyle.Render("Press Esc to go back.")
}
