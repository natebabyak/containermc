# Architecture

`main.go` is the entry point: `go run .` and `go build .`. It wires Docker,
SQLite, the core service, and the Bubble Tea program. There are no subcommands;
`--version` prints the build version.

The TUI calls `core.Service`. The core depends on container/runtime, store,
port-allocation and locking interfaces. Only adapters import Docker or SQL.
The import-boundary test keeps those dependencies out of the UI and core.

Docker is authoritative. Containers carry recoverable spec/identity labels,
worlds live in named volumes, and SQLite caches metadata. Startup and Engine
events reconcile the cache. Missing/drifted containers need an explicit Apply;
reconciliation never destroys resources. Server-specific process/file locks
protect mutations; SQLite uniqueness protects port reservations.

The UI has a server list, detail, console, connection checks, delete confirmation
and a single create form built from Bubbles text inputs. Creation defaults to
Vanilla with a 2 GiB heap and automatic loopback port. EULA acceptance is explicit.
Errors keep the form open. A retry updates/applies the saved server identity and
reserved port rather than creating duplicates. Settings-file scaffolding and
multi-page forms are intentionally absent from the current flow.

Long work runs in Bubble Tea commands; events update the app asynchronously.
Logs use batched reads and a 5,000-line buffer, with filtering and command history.
Closing the app stops observers and leaves containers running. RCON uses direct
Engine exec of rcon-cli, with no shell or published management port.

Image defaults use pinned multiarchitecture itzg digests: Alpine for Java 21/25,
maintained Java 8/17 alternatives for older game releases. Container limits add
1024 MiB above the heap, with 512 PIDs and no-new-privileges. Bootstrap retains
CHOWN, DAC_OVERRIDE, FOWNER, SETUID and SETGID; unrelated default capabilities are
dropped. Real Docker tests cover startup, TCP access, commands, restarts and crash
events. These checks do not replace native Windows/Linux release validation.

Backups, hosted services and automatic public sharing are outside the current
minimal UI. Existing metadata and world volumes remain compatible.
