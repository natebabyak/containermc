# Security reports

Please report vulnerabilities using [GitHub private vulnerability reporting](https://github.com/natebabyak/containermc/security/advisories/new). If the repository has not enabled this feature, contact the maintainer through their [GitHub profile](https://github.com/natebabyak) to arrange a private channel before sending sensitive details. Do not put exploit details or private addresses in public issues.

Include the affected version, OS, Docker version, steps to reproduce, and expected impact. The project currently supports the latest development/release version; there is no paid support service.

ContainerMC manages local Docker resources. Minecraft clients authenticate with `online-mode=true`. Only the game TCP port is published; RCON runs through Engine exec. LAN publishing is opt-in. Never expose your Docker socket over an unauthenticated network.
