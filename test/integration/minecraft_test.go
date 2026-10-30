//go:build integration

package integration

import (
	"context"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"containermc/internal/core"
	"containermc/internal/events"
	"containermc/internal/network"
	"containermc/internal/platform"
	"containermc/internal/runtime/docker"
	"containermc/internal/spec"
	"containermc/internal/store"
)

func TestMinecraftLifecycle(t *testing.T) {
	if os.Getenv("CONTAINERMC_ACCEPT_EULA") != "true" {
		t.Skip("set CONTAINERMC_ACCEPT_EULA=true only after accepting https://aka.ms/MinecraftEULA")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Minute)
	defer cancel()
	d := t.TempDir()
	s, e := store.Open(filepath.Join(d, "cache.db"))
	if e != nil {
		t.Fatal(e)
	}
	defer s.Close()
	r, e := docker.New(platform.EngineHost())
	if e != nil {
		t.Fatal(e)
	}
	defer r.Close()
	m := core.New(r, s, network.Allocator{Store: s}, platform.FileLock{Path: filepath.Join(d, "lock")}, d, "integration")
	watchCtx, stopWatch := context.WithCancel(ctx)
	watchDone := make(chan struct{})
	go func() { m.Watch(watchCtx); close(watchDone) }()
	defer func() { stopWatch(); <-watchDone }()
	notifications := m.Subscribe(watchCtx)
	v := spec.Defaults()
	v.Name = "ContainerMC isolated integration test"
	v.EULA = true
	v.Network.Share = false
	v.Resources.HeapMiB = 1024
	v.Resources.MemoryMiB = 2048
	defer func() {
		cleanup, c := context.WithTimeout(context.Background(), 90*time.Second)
		defer c()
		if e := m.Delete(cleanup, v.ID, false); e != nil {
			t.Error("cleanup:", e)
		}
	}()
	rec, e := m.CreateServer(ctx, v)
	if e != nil {
		t.Fatal(e)
	}
	logs, e := m.Logs(ctx, v.ID, true)
	if e != nil {
		t.Fatal(e)
	}
	for {
		select {
		case line := <-logs:
			if line.Err != nil {
				t.Log(line.Err)
			}
			if strings.Contains(line.Text, "Done (") && strings.Contains(line.Text, "For help") {
				goto ready
			}
		case <-ctx.Done():
			t.Fatal("Minecraft not ready before timeout")
		}
	}
ready:
	conn, e := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", strconv.Itoa(rec.Spec.Network.Port)), 3*time.Second)
	if e != nil {
		t.Fatal("game port not reachable:", e)
	}
	_ = conn.Close()
	for _, cmd := range []string{"list", "say containermc-integration"} {
		out, e := m.SendCommand(ctx, v.ID, cmd)
		if e != nil {
			t.Fatal(cmd, out, e)
		}
		t.Log(cmd, out)
	}
	for {
		select {
		case line := <-logs:
			if strings.Contains(line.Text, "containermc-integration") {
				goto said
			}
		case <-ctx.Done():
			t.Fatal("say command missing in logs")
		}
	}
said:
	// Change Docker directly, as a second app/terminal would, then check core's event/cache path.
	if e = r.Stop(ctx, rec.Status.ContainerID); e != nil {
		t.Fatal(e)
	}
	waitEvent(t, ctx, notifications, v.ID, events.Stopped)
	rows, e := m.List(ctx)
	stopped := false
	for _, row := range rows {
		if row.Spec.ID == v.ID && row.Status.State == "exited" {
			stopped = true
		}
	}
	if e != nil || !stopped {
		t.Fatal("external stop not reconciled", rows, e)
	}
	if e = m.Start(ctx, v.ID); e != nil {
		t.Fatal(e)
	}
	for {
		select {
		case line, ok := <-logs:
			if !ok {
				t.Fatal("log stream did not survive restart")
			}
			if strings.Contains(line.Text, "Done (") && strings.Contains(line.Text, "For help") {
				goto restarted
			}
		case <-ctx.Done():
			t.Fatal("no readiness log after restart")
		}
	}
restarted:
	if out, e := m.SendCommand(ctx, v.ID, "list"); e != nil {
		t.Fatal("console after restart", out, e)
	}
	if e = r.Kill(ctx, rec.Status.ContainerID); e != nil {
		t.Fatal(e)
	}
	waitEvent(t, ctx, notifications, v.ID, events.Crashed)
}

func waitEvent(t *testing.T, ctx context.Context, ch <-chan events.Event, id string, kind events.Kind) {
	t.Helper()
	timer := time.NewTimer(5 * time.Second)
	defer timer.Stop()
	for {
		select {
		case e := <-ch:
			if e.ServerID == id && e.Kind == kind {
				return
			}
		case <-timer.C:
			t.Fatalf("missing %s event", kind)
		case <-ctx.Done():
			t.Fatal(ctx.Err())
		}
	}
}
