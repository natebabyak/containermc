package tui

import "fmt"

func (m *Model) serversView() string {
	if len(m.servers) == 0 {
		return headingStyle.Render("Your next world starts here.") + "\n\n" + mutedStyle.Render("Create a local Minecraft Java server in Docker.\nYour worlds stay on this computer.") + "\n\n" + activeButtonStyle.Render(" n  Create a server ")
	}
	return headingStyle.Render("Your servers") + mutedStyle.Render(fmt.Sprintf("  %d total", len(m.servers))) + "\n\n" + m.table.View() + "\n" + mutedStyle.Render("Servers keep running when you close ContainerMC.")
}
