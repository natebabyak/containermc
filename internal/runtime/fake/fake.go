package fake

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"containermc/internal/runtime"
)

type Runtime struct {
	mu         sync.Mutex
	Containers map[string]runtime.Container
	Volumes    map[string]bool
	Failures   map[string]error
	subs       map[chan runtime.Event]struct{}
	logs       map[string][]runtime.LogLine
	logSubs    map[string]map[chan runtime.LogLine]struct{}
	Info       runtime.EngineInfo
}

func New() *Runtime {
	return &Runtime{Containers: map[string]runtime.Container{}, Volumes: map[string]bool{}, Failures: map[string]error{}, subs: map[chan runtime.Event]struct{}{}, logs: map[string][]runtime.LogLine{}, logSubs: map[string]map[chan runtime.LogLine]struct{}{}, Info: runtime.EngineInfo{Name: "Fake Docker", Version: "29", API: "1.56", OS: "linux", Arch: "arm64", MemoryBytes: 8 << 30, CPUs: 4}}
}
func (r *Runtime) Close() error { return nil }
func (r *Runtime) Ping(context.Context) (runtime.EngineInfo, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.Info, r.Failures["Ping"]
}
func (r *Runtime) EnsureImage(ctx context.Context, s string, p func(string)) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.Failures["EnsureImage"]
}
func (r *Runtime) EnsureVolume(ctx context.Context, n string, l map[string]string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.Volumes[n] = true
	return r.Failures["EnsureVolume"]
}
func (r *Runtime) RemoveVolume(ctx context.Context, n string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.Volumes, n)
	return r.Failures["RemoveVolume"]
}
func clone(c runtime.Container) runtime.Container {
	l := map[string]string{}
	for k, v := range c.Labels {
		l[k] = v
	}
	c.Labels = l
	return c
}
func (r *Runtime) Create(ctx context.Context, s runtime.ContainerSpec) (string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if e := r.Failures["Create"]; e != nil {
		return "", e
	}
	for _, c := range r.Containers {
		if c.Name == s.Name {
			return "", runtime.ErrConflict
		}
	}
	id := fmt.Sprintf("fake-%d-%s", time.Now().UnixNano(), s.Name)
	r.Containers[id] = clone(runtime.Container{ID: id, Name: s.Name, Labels: s.Labels, State: "created"})
	return id, nil
}
func (r *Runtime) change(id, state, action string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if e := r.Failures[action]; e != nil {
		return e
	}
	c, ok := r.Containers[id]
	if !ok {
		return runtime.ErrNotFound
	}
	c.State = state
	r.Containers[id] = c
	r.emit(runtime.Event{ServerID: c.Labels["app.server-id"], ContainerID: id, Action: action})
	return nil
}
func (r *Runtime) Start(ctx context.Context, id string) error {
	err := r.change(id, "running", "start")
	if err == nil {
		r.AppendLog(id, "runtime contract ready")
	}
	return err
}
func (r *Runtime) Stop(ctx context.Context, id string) error { return r.change(id, "exited", "die") }
func (r *Runtime) Remove(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if e := r.Failures["Remove"]; e != nil {
		return e
	}
	c, ok := r.Containers[id]
	if !ok {
		return runtime.ErrNotFound
	}
	delete(r.Containers, id)
	r.emit(runtime.Event{ServerID: c.Labels["app.server-id"], ContainerID: id, Action: "destroy"})
	return nil
}
func (r *Runtime) List(context.Context) ([]runtime.Container, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := []runtime.Container{}
	for _, c := range r.Containers {
		out = append(out, clone(c))
	}
	return out, r.Failures["List"]
}
func (r *Runtime) Events(ctx context.Context) <-chan runtime.Event {
	c := make(chan runtime.Event, 128)
	r.mu.Lock()
	r.subs[c] = struct{}{}
	r.mu.Unlock()
	go func() { <-ctx.Done(); r.mu.Lock(); delete(r.subs, c); close(c); r.mu.Unlock() }()
	return c
}
func (r *Runtime) emit(e runtime.Event) {
	for c := range r.subs {
		select {
		case c <- e:
		default:
		}
	}
}
func (r *Runtime) Inject(e runtime.Event) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if c, ok := r.Containers[e.ContainerID]; ok {
		switch e.Action {
		case "start":
			c.State = "running"
		case "die":
			c.State = "exited"
		}
		r.Containers[c.ID] = c
	}
	r.emit(e)
}
func (r *Runtime) AppendLog(id, line string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	v := runtime.LogLine{Time: time.Now(), Text: line}
	r.logs[id] = append(r.logs[id], v)
	if len(r.logs[id]) > 200 {
		r.logs[id] = r.logs[id][1:]
	}
	for c := range r.logSubs[id] {
		select {
		case c <- v:
		default:
		}
	}
}
func (r *Runtime) Logs(ctx context.Context, id string, follow bool) (<-chan runtime.LogLine, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.Containers[id]; !ok {
		return nil, runtime.ErrNotFound
	}
	c := make(chan runtime.LogLine, 256)
	for _, v := range r.logs[id] {
		c <- v
	}
	if !follow {
		close(c)
		return c, nil
	}
	if r.logSubs[id] == nil {
		r.logSubs[id] = map[chan runtime.LogLine]struct{}{}
	}
	r.logSubs[id][c] = struct{}{}
	go func() { <-ctx.Done(); r.mu.Lock(); delete(r.logSubs[id], c); close(c); r.mu.Unlock() }()
	return c, nil
}
func (r *Runtime) Stats(ctx context.Context, id string) (<-chan runtime.Stats, error) {
	r.mu.Lock()
	_, ok := r.Containers[id]
	r.mu.Unlock()
	if !ok {
		return nil, runtime.ErrNotFound
	}
	c := make(chan runtime.Stats, 1)
	go func() {
		defer close(c)
		t := time.NewTicker(time.Second)
		defer t.Stop()
		for {
			select {
			case c <- runtime.Stats{MemoryUsed: 512 << 20, MemoryLimit: 3 << 30, CPUPercent: 2}:
			case <-ctx.Done():
				return
			}
			select {
			case <-t.C:
			case <-ctx.Done():
				return
			}
		}
	}()
	return c, nil
}
func (r *Runtime) Exec(ctx context.Context, id string, args []string) (string, error) {
	r.mu.Lock()
	c, ok := r.Containers[id]
	r.mu.Unlock()
	if !ok {
		return "", runtime.ErrNotFound
	}
	if c.State != "running" {
		return "", fmt.Errorf("server is not running")
	}
	command := strings.Join(args[1:], " ")
	if strings.HasPrefix(command, "say ") {
		r.AppendLog(id, "[Server] "+strings.TrimPrefix(command, "say "))
	}
	return "Executed: " + command, nil
}
