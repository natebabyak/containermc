package events

import (
	"containermc/internal/runtime"
	"context"
	"sync"
)

type Kind string

const (
	Changed  Kind = "Changed"
	Starting Kind = "ServerStarting"
	Ready    Kind = "Ready"
	Stopped  Kind = "Stopped"
	Crashed  Kind = "Crashed"
	Progress Kind = "Progress"
	Metrics  Kind = "Stats"
	Failure  Kind = "Failure"
)

type Event struct {
	Kind              Kind
	ServerID, Message string
	Stats             runtime.Stats
}
type Bus struct {
	mu   sync.Mutex
	subs map[chan Event]struct{}
}

func New() *Bus { return &Bus{subs: map[chan Event]struct{}{}} }
func (b *Bus) Subscribe(ctx context.Context) <-chan Event {
	c := make(chan Event, 128)
	b.mu.Lock()
	b.subs[c] = struct{}{}
	b.mu.Unlock()
	go func() { <-ctx.Done(); b.mu.Lock(); delete(b.subs, c); close(c); b.mu.Unlock() }()
	return c
}
func (b *Bus) Publish(e Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for c := range b.subs {
		select {
		case c <- e:
		default:
			select {
			case <-c:
			default:
			}
			select {
			case c <- e:
			default:
			}
		}
	}
}
