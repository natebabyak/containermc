package events

import (
	"context"
	"testing"
	"time"
)

func TestSlowSubscriberDoesNotBlock(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	b := New()
	c := b.Subscribe(ctx)
	done := make(chan struct{})
	go func() {
		for i := 0; i < 10000; i++ {
			b.Publish(Event{Kind: Changed})
		}
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("publisher blocked")
	}
	cancel()
	for range c {
	}
	b.Publish(Event{Kind: Changed})
}
