// Package fake provides a complete in-memory core service for TUI development.
package fake

import (
	"context"
	"fmt"
	"sync"

	"containermc/internal/core"
	"containermc/internal/network"
	runtimefake "containermc/internal/runtime/fake"
	"containermc/internal/spec"
)

type Service struct {
	*core.Manager
	Runtime *runtimefake.Runtime
}

func New(dataDir string) *Service {
	r := runtimefake.New()
	s := &memory{records: map[string]spec.Record{}, ports: map[string]int{}}
	return &Service{Manager: core.New(r, s, network.Allocator{Store: s}, noLock{}, dataDir, "fake"), Runtime: r}
}

type noLock struct{}

func (noLock) Acquire(context.Context, string) (func(), error) { return func() {}, nil }

type memory struct {
	mu      sync.Mutex
	records map[string]spec.Record
	ports   map[string]int
}

func (m *memory) SaveServer(ctx context.Context, r spec.Record) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.records[r.Spec.ID] = r
	return nil
}
func (m *memory) GetServer(ctx context.Context, id string) (spec.Record, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	r, ok := m.records[id]
	if !ok {
		return r, fmt.Errorf("server not found")
	}
	return r, nil
}
func (m *memory) ListServers(context.Context) ([]spec.Record, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []spec.Record{}
	for _, r := range m.records {
		out = append(out, r)
	}
	return out, nil
}
func (m *memory) DeleteServer(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.records, id)
	delete(m.ports, id)
	return nil
}
func (m *memory) ReservePort(ctx context.Context, id string, p int) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, v := range m.ports {
		if v == p {
			return network.ErrReserved
		}
	}
	m.ports[id] = p
	return nil
}
func (m *memory) ReleasePort(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.ports, id)
	return nil
}
func (m *memory) GetPort(ctx context.Context, id string) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.ports[id]
	if !ok {
		return 0, fmt.Errorf("not reserved")
	}
	return p, nil
}
