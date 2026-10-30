// Package runtime defines the container engine boundary; no engine SDK types escape it.
package runtime

import (
	"context"
	"errors"
	"time"
)

var (
	ErrNotFound   = errors.New("not found")
	ErrConflict   = errors.New("conflict")
	ErrPermission = errors.New("permission denied")
	ErrPortInUse  = errors.New("port in use")
)

type EngineInfo struct {
	Name, Version, API, OS, Arch string
	MemoryBytes                  int64
	CPUs                         int
	Unsupported                  bool
}
type ContainerSpec struct {
	Command             []string
	ContainerPort       int
	Name, Image, Volume string
	Env                 []string
	Labels              map[string]string
	HostIP              string
	HostPort            int
	MemoryBytes         int64
	NanoCPUs            int64
	PIDs                int64
	Restart             string
	CapDrop             []string
}
type Container struct {
	ID, Name, State, Health string
	Labels                  map[string]string
	ExitCode                int
}
type LogLine struct {
	Time time.Time
	Text string
	Err  error
}
type Stats struct {
	CPUPercent                                    float64
	MemoryUsed, MemoryLimit, NetworkRX, NetworkTX uint64
	Err                                           error
}
type Event struct {
	ServerID, ContainerID, Action string
	ExitCode                      int
	Err                           error
}
type Runtime interface {
	Ping(context.Context) (EngineInfo, error)
	EnsureImage(context.Context, string, func(string)) error
	EnsureVolume(context.Context, string, map[string]string) error
	RemoveVolume(context.Context, string) error
	Create(context.Context, ContainerSpec) (string, error)
	Start(context.Context, string) error
	Stop(context.Context, string) error
	Remove(context.Context, string) error
	List(context.Context) ([]Container, error)
	Logs(context.Context, string, bool) (<-chan LogLine, error)
	Stats(context.Context, string) (<-chan Stats, error)
	Exec(context.Context, string, []string) (string, error)
	Events(context.Context) <-chan Event
	Close() error
}
