# Development

Use Go 1.25.8+ and Docker Desktop on macOS/Windows or Docker Engine on Linux.

```sh
go run .
go test -race ./...
go vet ./...
go build .
```

Unit tests use fakes and temporary SQLite files. Docker integration tests run with
`go test -tags integration ./test/integration -v -timeout 12m`. The Minecraft test
also needs `CONTAINERMC_ACCEPT_EULA=true`, after you accept
[the EULA](https://aka.ms/MinecraftEULA). Tests use disposable servers and volumes.

Update/review UI snapshots with `go test ./internal/tui -update`; mapping goldens
with `go test ./internal/itzg -update`. Regenerate SQL with
`go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0 generate`.

Keep adapters outside the core and TUI; see [architecture](../docs/architecture.md).
CI runs race tests, vet and a static build on Linux, macOS and Windows. Native
Docker and terminal checks on all three platforms remain release checks.

PRs should describe the behavior changed and validation performed. Contributions
are MIT licensed; there is no CLA or DCO requirement.
