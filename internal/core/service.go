// Package core orchestrates application operations through inward-facing interfaces.
package core

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"containermc/internal/events"
	"containermc/internal/itzg"
	"containermc/internal/runtime"
	"containermc/internal/spec"
)

type Check struct{ Name, Level, Detail, Hint, URL string }
type Preflight struct {
	Checks []Check
	Engine runtime.EngineInfo
}

func (p Preflight) OK() bool {
	for _, c := range p.Checks {
		if c.Level == "fail" {
			return false
		}
	}
	return true
}

type Service interface {
	Preflight(context.Context) (Preflight, error)
	Reconcile(context.Context) error
	List(context.Context) ([]spec.Record, error)
	CreateServer(context.Context, spec.Server) (spec.Record, error)
	UpdateSpec(context.Context, spec.Server) error
	Apply(context.Context, string) error
	Start(context.Context, string) error
	Stop(context.Context, string) error
	Delete(context.Context, string, bool) error
	Logs(context.Context, string, bool) (<-chan runtime.LogLine, error)
	SendCommand(context.Context, string, string) (string, error)
	Subscribe(context.Context) <-chan events.Event
}
type Store interface {
	SaveServer(context.Context, spec.Record) error
	GetServer(context.Context, string) (spec.Record, error)
	ListServers(context.Context) ([]spec.Record, error)
	DeleteServer(context.Context, string) error
	ReservePort(context.Context, string, int) error
	GetPort(context.Context, string) (int, error)
	ReleasePort(context.Context, string) error
}
type PortAllocator interface {
	Allocate(context.Context, string, int, bool) (int, error)
	Release(context.Context, string) error
}
type Locker interface {
	Acquire(context.Context, string) (func(), error)
}
type Manager struct {
	runtime          runtime.Runtime
	store            Store
	ports            PortAllocator
	lock             Locker
	bus              *events.Bus
	dataDir, version string
	mu               sync.Mutex
	locks            map[string]chan struct{}
}

func New(r runtime.Runtime, s Store, p PortAllocator, l Locker, dataDir, version string) *Manager {
	return &Manager{runtime: r, store: s, ports: p, lock: l, bus: events.New(), dataDir: dataDir, version: version, locks: map[string]chan struct{}{}}
}
func (m *Manager) Subscribe(ctx context.Context) <-chan events.Event { return m.bus.Subscribe(ctx) }
func (m *Manager) mutation(ctx context.Context, id string, fn func() error) error {
	m.mu.Lock()
	l := m.locks[id]
	if l == nil {
		l = make(chan struct{}, 1)
		m.locks[id] = l
	}
	m.mu.Unlock()
	select {
	case l <- struct{}{}:
	case <-ctx.Done():
		return ctx.Err()
	}
	defer func() { <-l }()
	if err := ctx.Err(); err != nil {
		return err
	}
	unlock, err := m.lock.Acquire(ctx, id)
	if err != nil {
		return err
	}
	defer unlock()
	err = fn()
	m.bus.Publish(events.Event{Kind: events.Changed, ServerID: id})
	return err
}
func (m *Manager) List(ctx context.Context) ([]spec.Record, error) { return m.store.ListServers(ctx) }
func (m *Manager) Preflight(ctx context.Context) (Preflight, error) {
	p := Preflight{}
	i, err := m.runtime.Ping(ctx)
	if err != nil {
		p.Checks = append(p.Checks, Check{Name: "Docker", Level: "fail", Detail: err.Error(), Hint: "Start Docker Desktop (macOS/Windows) or Docker Engine (Linux). On Linux check socket permissions or rootless Docker; do not run ContainerMC as root.", URL: "https://docs.docker.com/get-started/get-docker/"})
	} else {
		p.Engine = i
		p.Checks = append(p.Checks, Check{Name: "Docker", Level: "pass", Detail: fmt.Sprintf("%s %s · API %s · %s/%s", i.Name, i.Version, i.API, i.OS, i.Arch)})
		if i.Unsupported {
			p.Checks = append(p.Checks, Check{Name: "Engine", Level: "warn", Detail: "Podman is not officially supported", Hint: "Use Docker Engine or Docker Desktop"})
		}
		level := "pass"
		if i.OS != "linux" || (i.Arch != "aarch64" && i.Arch != "arm64" && i.Arch != "x86_64" && i.Arch != "amd64") {
			level = "fail"
		}
		p.Checks = append(p.Checks, Check{Name: "Platform", Level: level, Detail: i.OS + "/" + i.Arch, Hint: "Use Linux containers on amd64 or arm64. Windows: enable Docker Desktop's WSL2 backend."})
		level = "pass"
		if i.MemoryBytes < 4<<30 {
			level = "warn"
		}
		p.Checks = append(p.Checks, Check{Name: "Engine RAM", Level: level, Detail: fmt.Sprintf("%.1f GiB available to Docker", float64(i.MemoryBytes)/(1<<30)), Hint: "Increase Docker Desktop VM memory if needed. Each default server has a 3 GiB limit."})
	}
	f, e := os.CreateTemp(m.dataDir, ".writable-*")
	if e != nil {
		p.Checks = append(p.Checks, Check{Name: "Data directory", Level: "fail", Detail: e.Error(), Hint: "Allow write access to " + m.dataDir})
	} else {
		_ = f.Close()
		_ = os.Remove(f.Name())
		p.Checks = append(p.Checks, Check{Name: "Data directory", Level: "pass", Detail: filepath.Clean(m.dataDir)})
	}
	unlock, e := m.lock.Acquire(ctx, "preflight")
	if e != nil {
		p.Checks = append(p.Checks, Check{Name: "Operation lock", Level: "fail", Detail: e.Error(), Hint: "Wait for the other ContainerMC operation to finish, then retry."})
	} else {
		unlock()
		p.Checks = append(p.Checks, Check{Name: "Operation lock", Level: "pass", Detail: "Available"})
	}
	p.Checks = append(p.Checks, Check{Name: "Disk capacity", Level: "warn", Detail: "Docker Engine does not report free space through this API", Hint: "Check free disk space in Docker Desktop or the Engine data root before creating large worlds."})
	return p, nil
}
func (m *Manager) CreateServer(ctx context.Context, s spec.Server) (out spec.Record, err error) {
	err = m.mutation(ctx, s.ID, func() error {
		if e := spec.Validate(s); e != nil {
			return e
		}
		if _, e := itzg.Image(s); e != nil {
			return e
		}
		rs, e := m.store.ListServers(ctx)
		if e != nil {
			return e
		}
		for _, r := range rs {
			if r.Spec.ID == s.ID {
				return fmt.Errorf("server %s already exists", s.ID)
			}
		}
		p, e := m.ports.Allocate(ctx, s.ID, s.Network.Port, s.Network.LAN)
		if e != nil {
			return e
		}
		s.Network.Port = p
		out = spec.Record{Spec: s, Status: spec.Status{State: "missing", Flag: "missing"}}
		if e = m.store.SaveServer(ctx, out); e != nil {
			_ = m.ports.Release(ctx, s.ID)
			return e
		}
		// Persist desired configuration first: failed pulls/creates remain explicitly retryable.
		return m.apply(ctx, out)
	})
	if err == nil {
		out, err = m.store.GetServer(ctx, s.ID)
	}
	return
}
func (m *Manager) UpdateSpec(ctx context.Context, s spec.Server) error {
	return m.mutation(ctx, s.ID, func() error {
		if err := spec.Validate(s); err != nil {
			return err
		}
		r, err := m.store.GetServer(ctx, s.ID)
		if err != nil {
			return err
		}
		if s.Network.Port != r.Spec.Network.Port {
			return fmt.Errorf("changing a reserved port requires recreating the server")
		}
		r.Spec = s
		r.Status.Flag = "drifted"
		return m.store.SaveServer(ctx, r)
	})
}
func (m *Manager) Apply(ctx context.Context, id string) error {
	return m.mutation(ctx, id, func() error {
		r, e := m.store.GetServer(ctx, id)
		if e != nil {
			return e
		}
		return m.apply(ctx, r)
	})
}
func (m *Manager) apply(ctx context.Context, r spec.Record) error {
	cfg, err := itzg.Build(r.Spec, m.version)
	if err != nil {
		return err
	}
	if err = m.runtime.EnsureImage(ctx, cfg.Image, func(s string) { m.bus.Publish(events.Event{Kind: events.Progress, ServerID: r.Spec.ID, Message: s}) }); err != nil {
		return fmt.Errorf("pull image: %w", err)
	}
	if err = m.runtime.EnsureVolume(ctx, cfg.Volume, cfg.Labels); err != nil {
		return err
	}
	cs, err := m.runtime.List(ctx)
	if err != nil {
		return err
	}
	for _, c := range cs {
		if c.Labels["app.server-id"] != r.Spec.ID {
			continue
		}
		if c.Labels["app.spec-hash"] == spec.Hash(r.Spec) {
			r.Status = spec.Status{ContainerID: c.ID, State: c.State}
			if err = m.store.SaveServer(ctx, r); err != nil {
				return err
			}
			return m.start(ctx, r)
		}
		if err = m.runtime.Stop(ctx, c.ID); err != nil && !errors.Is(err, runtime.ErrNotFound) {
			return err
		}
		if err = m.runtime.Remove(ctx, c.ID); err != nil && !errors.Is(err, runtime.ErrNotFound) {
			return err
		}
	}
	id, err := m.runtime.Create(ctx, cfg)
	if err != nil {
		return err
	}
	r.Status = spec.Status{ContainerID: id, State: "created"}
	if err = m.store.SaveServer(ctx, r); err != nil {
		return err
	}
	return m.start(ctx, r)
}
func (m *Manager) start(ctx context.Context, r spec.Record) error {
	if r.Status.ContainerID == "" {
		return fmt.Errorf("container missing; use Apply to recreate it")
	}
	if err := m.runtime.Start(ctx, r.Status.ContainerID); err != nil {
		return err
	}
	r.Status.State = "running"
	if err := m.store.SaveServer(ctx, r); err != nil {
		return err
	}
	m.bus.Publish(events.Event{Kind: events.Starting, ServerID: r.Spec.ID})
	return nil
}
func (m *Manager) Start(ctx context.Context, id string) error {
	return m.mutation(ctx, id, func() error {
		r, e := m.store.GetServer(ctx, id)
		if e != nil {
			return e
		}
		return m.start(ctx, r)
	})
}
func (m *Manager) Stop(ctx context.Context, id string) error {
	return m.mutation(ctx, id, func() error {
		r, e := m.store.GetServer(ctx, id)
		if e != nil {
			return e
		}
		if e = m.runtime.Stop(ctx, r.Status.ContainerID); e != nil {
			return e
		}
		r.Status.State = "exited"
		return m.store.SaveServer(ctx, r)
	})
}
func (m *Manager) Delete(ctx context.Context, id string, keepData bool) error {
	return m.mutation(ctx, id, func() error {
		r, e := m.store.GetServer(ctx, id)
		if e != nil {
			return e
		}
		cs, e := m.runtime.List(ctx)
		if e != nil {
			return e
		}
		for _, c := range cs {
			if c.Labels["app.server-id"] != id {
				continue
			}
			if e = m.runtime.Stop(ctx, c.ID); e != nil && !errors.Is(e, runtime.ErrNotFound) {
				return e
			}
			if e = m.runtime.Remove(ctx, c.ID); e != nil && !errors.Is(e, runtime.ErrNotFound) {
				return e
			}
		}
		if !keepData {
			if e = m.runtime.RemoveVolume(ctx, itzg.Volume(r.Spec.ID)); e != nil && !errors.Is(e, runtime.ErrNotFound) {
				return e
			}
		}
		return m.store.DeleteServer(ctx, id)
	})
}
func (m *Manager) Reconcile(ctx context.Context) error {
	cs, err := m.runtime.List(ctx)
	if err != nil {
		return err
	}
	rs, err := m.store.ListServers(ctx)
	if err != nil {
		return err
	}
	ids := map[string]bool{}
	for _, r := range rs {
		ids[r.Spec.ID] = true
	}
	for _, c := range cs {
		if id := c.Labels["app.server-id"]; id != "" {
			ids[id] = true
		}
	}
	for id := range ids {
		err = m.mutation(ctx, id, func() error {
			// Re-read under this server's process/file lock so a slow create or delete
			// cannot race a stale reconciliation snapshot.
			current, e := m.runtime.List(ctx)
			if e != nil {
				return e
			}
			cache, e := m.store.ListServers(ctx)
			if e != nil {
				return e
			}
			var r spec.Record
			found := false
			for _, v := range cache {
				if v.Spec.ID == id {
					r = v
					found = true
					break
				}
			}
			var live *runtime.Container
			for i := range current {
				if current[i].Labels["app.server-id"] == id {
					if live != nil {
						return fmt.Errorf("multiple containers claim server %s; inspect them in Docker before making changes", id)
					}
					live = &current[i]
				}
			}
			if live == nil {
				if !found {
					return nil
				}
				r.Status = spec.Status{State: "missing", Flag: "missing"}
				return m.store.SaveServer(ctx, r)
			}
			if !found {
				s, e := spec.Decode([]byte(live.Labels["app.spec"]))
				if e != nil || s.ID != id || spec.Validate(s) != nil {
					slog.Warn("Unreadable managed container labels", "container", live.ID)
					m.bus.Publish(events.Event{Kind: events.Failure, ServerID: id, Message: "Container has unreadable labels: " + live.ID + ". Inspect it in Docker Desktop; no data was removed."})
					return nil
				}
				r.Spec = s
			}
			r.Status = spec.Status{ContainerID: live.ID, State: live.State}
			if live.Labels["app.spec-hash"] != spec.Hash(r.Spec) {
				r.Status.Flag = "drifted"
			}
			if e = m.store.SaveServer(ctx, r); e != nil {
				return e
			}
			if _, e = m.store.GetPort(ctx, id); e != nil {
				if e = m.store.ReservePort(ctx, id, r.Spec.Network.Port); e != nil {
					return fmt.Errorf("recover port reservation for %s: %w", id, e)
				}
			}
			return nil
		})
		if err != nil {
			return err
		}
	}
	return nil
}
func (m *Manager) SendCommand(ctx context.Context, id, command string) (string, error) {
	if strings.TrimSpace(command) == "" || strings.ContainsAny(command, "\r\n") {
		return "", fmt.Errorf("enter one console command")
	}
	r, err := m.store.GetServer(ctx, id)
	if err != nil {
		return "", err
	}
	if r.Status.State != "running" {
		return "", fmt.Errorf("server is not running")
	}
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	return m.runtime.Exec(ctx, r.Status.ContainerID, []string{"rcon-cli", command})
}
func (m *Manager) Logs(ctx context.Context, id string, follow bool) (<-chan runtime.LogLine, error) {
	r, err := m.store.GetServer(ctx, id)
	if err != nil {
		return nil, err
	}
	if r.Status.ContainerID == "" {
		return nil, fmt.Errorf("container missing; use Apply to recreate it")
	}
	if !follow {
		return m.runtime.Logs(ctx, r.Status.ContainerID, false)
	}
	out := make(chan runtime.LogLine, 512)
	go func() {
		defer close(out)
		var last time.Time
		lastText := ""
		for ctx.Err() == nil {
			r, e := m.store.GetServer(ctx, id)
			if e != nil {
				return
			}
			stream, e := m.runtime.Logs(ctx, r.Status.ContainerID, true)
			if e == nil {
				for line := range stream {
					if line.Err == nil {
						if line.Time.Before(last) || (line.Time.Equal(last) && line.Text == lastText) {
							continue
						}
						last = line.Time
						lastText = line.Text
					}
					if strings.Contains(line.Text, "Done (") && strings.Contains(line.Text, "For help") {
						m.bus.Publish(events.Event{Kind: events.Ready, ServerID: id})
					}
					select {
					case out <- line:
					case <-ctx.Done():
						return
					}
				}
			} else {
				select {
				case out <- runtime.LogLine{Err: e}:
				case <-ctx.Done():
					return
				}
			}
			select {
			case <-time.After(time.Second):
			case <-ctx.Done():
				return
			}
		}
	}()
	return out, nil
}

// Watch reconnects through the runtime and keeps the cache and metrics current.
// Cancelling it stops observers, never containers.
func (m *Manager) Watch(ctx context.Context) {
	stream := m.runtime.Events(ctx)
	metrics := map[string]context.CancelFunc{}
	defer func() {
		for _, c := range metrics {
			c()
		}
	}()
	refresh := func() {
		rs, e := m.List(ctx)
		if e != nil {
			return
		}
		active := map[string]bool{}
		for _, r := range rs {
			if r.Status.State != "running" {
				continue
			}
			key := r.Status.ContainerID
			active[key] = true
			if _, ok := metrics[key]; ok {
				continue
			}
			cctx, cancel := context.WithCancel(ctx)
			metrics[key] = cancel
			go func(id, cid string) {
				for cctx.Err() == nil {
					c, e := m.runtime.Stats(cctx, cid)
					if e == nil {
						for v := range c {
							if v.Err != nil {
								break
							}
							m.bus.Publish(events.Event{Kind: events.Metrics, ServerID: id, Stats: v})
						}
					}
					select {
					case <-time.After(time.Second):
					case <-cctx.Done():
						return
					}
				}
			}(r.Spec.ID, key)
		}
		for key, c := range metrics {
			if !active[key] {
				c()
				delete(metrics, key)
			}
		}
	}
	if err := m.Reconcile(ctx); err != nil {
		m.bus.Publish(events.Event{Kind: events.Failure, Message: err.Error()})
	}
	refresh()
	for {
		select {
		case <-ctx.Done():
			return
		case e, ok := <-stream:
			if !ok {
				return
			}
			if e.Err != nil {
				m.bus.Publish(events.Event{Kind: events.Failure, Message: "Docker events disconnected; reconnecting: " + e.Err.Error()})
				continue
			}
			if err := m.Reconcile(ctx); err != nil {
				m.bus.Publish(events.Event{Kind: events.Failure, Message: err.Error()})
				continue
			}
			kind := events.Changed
			switch e.Action {
			case "start":
				kind = events.Starting
			case "die":
				kind = events.Stopped
				if e.ExitCode != 0 {
					kind = events.Crashed
				}
			case "health_status: healthy":
				kind = events.Ready
			}
			m.bus.Publish(events.Event{Kind: kind, ServerID: e.ServerID})
			refresh()
		}
	}
}
