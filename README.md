# ContainerMC

Local Minecraft Java servers in Docker, managed from a terminal UI.

```sh
go run .
```

Requires Go 1.25.8+ and Docker Desktop (macOS/Windows) or Docker Engine (Linux).

Press **n** for the single-screen create form. Set a name and Minecraft version,
accept the [Minecraft EULA](https://aka.ms/MinecraftEULA), then press **Ctrl+S**.
Defaults: Vanilla, 2 GiB Java heap, and an automatic localhost port.

**Enter** opens a server. **s** starts, **x** stops, **r** restarts, **c** opens
logs/console, and **d** deletes with confirmation. **Esc** goes back; **q** quits.
Servers keep running when the app closes. Worlds stay in Docker volumes.

```sh
go test -race ./...
go vet ./...
go build .
```

`main.go` wires the app. `internal/tui` uses Bubble Tea, Bubbles and Lip Gloss;
the remaining packages handle Docker, server specs and the SQLite cache.
`CONTAINERMC_DATA_DIR` selects an isolated data directory for testing.
`DOCKER_HOST` is supported.

See [development notes](.github/CONTRIBUTING.md) and the
[architecture](docs/architecture.md) for details. [MIT licensed](LICENSE).
Built on [itzg/minecraft-server](https://github.com/itzg/docker-minecraft-server).
