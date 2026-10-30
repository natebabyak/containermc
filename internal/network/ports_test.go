package network_test

import (
	"containermc/internal/network"
	"containermc/internal/store"
	"context"
	"net"
	"path/filepath"
	"sync"
	"testing"
)

func TestAllocator(t *testing.T) {
	s, e := store.Open(filepath.Join(t.TempDir(), "db"))
	if e != nil {
		t.Fatal(e)
	}
	defer s.Close()
	a := network.Allocator{Store: s}
	ctx := context.Background()
	l, e := net.Listen("tcp4", "127.0.0.1:0")
	if e != nil {
		t.Fatal(e)
	}
	p := l.Addr().(*net.TCPAddr).Port
	got, e := a.Allocate(ctx, "busy", p, false)
	_ = l.Close()
	if e != nil || got == p {
		t.Fatal(got, e)
	}
	if e = a.Release(ctx, "busy"); e != nil {
		t.Fatal(e)
	}
	got, e = a.Allocate(ctx, "free", p, false)
	if e != nil || got != p {
		t.Fatal(got, e)
	}
	var wg sync.WaitGroup
	ports := make(chan int, 2)
	for _, id := range []string{"a", "b"} {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			p, e := a.Allocate(ctx, id, 0, false)
			if e != nil {
				t.Error(e)
			}
			ports <- p
		}(id)
	}
	wg.Wait()
	if p, q := <-ports, <-ports; p == q {
		t.Fatal("duplicate allocation", p)
	}
}
