package network

import (
	"context"
	"errors"
	"fmt"
	"net"
	"strconv"
	"syscall"
)

type Reservations interface {
	ReservePort(context.Context, string, int) error
	ReleasePort(context.Context, string) error
	GetPort(context.Context, string) (int, error)
}

var ErrReserved = errors.New("port already reserved")

type Allocator struct{ Store Reservations }

func (a Allocator) Allocate(ctx context.Context, id string, preferred int, lan bool) (int, error) {
	if p, err := a.Store.GetPort(ctx, id); err == nil {
		return p, nil
	}
	start := preferred
	if start == 0 {
		start = 25565
	}
	host := "127.0.0.1"
	if lan {
		host = "0.0.0.0"
	}
	for p := start; p <= 65535; p++ {
		if err := ctx.Err(); err != nil {
			return 0, err
		}
		l, e := net.Listen("tcp4", net.JoinHostPort(host, strconv.Itoa(p)))
		if e != nil {
			if !errors.Is(e, syscall.EADDRINUSE) {
				return 0, fmt.Errorf("check TCP port %d: %w", p, e)
			}
			continue
		}
		_ = l.Close()
		err := a.Store.ReservePort(ctx, id, p)
		if err == nil {
			return p, nil
		}
		if !errors.Is(err, ErrReserved) {
			return 0, fmt.Errorf("reserve TCP port: %w", err)
		}
	}
	return 0, fmt.Errorf("no free TCP port from %d through 65535", start)
}
func (a Allocator) Release(ctx context.Context, id string) error { return a.Store.ReleasePort(ctx, id) }
