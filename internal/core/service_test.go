package core_test

import (
	"context"
	"fmt"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"containermc/internal/core"
	"containermc/internal/events"
	"containermc/internal/itzg"
	"containermc/internal/network"
	"containermc/internal/platform"
	"containermc/internal/runtime"
	"containermc/internal/runtime/fake"
	"containermc/internal/spec"
	"containermc/internal/store"
)

func setup(t *testing.T) (*core.Manager, *fake.Runtime, *store.Store) {
	t.Helper()
	d := t.TempDir()
	s, e := store.Open(filepath.Join(d, "cache.db"))
	if e != nil {
		t.Fatal(e)
	}
	t.Cleanup(func() { _ = s.Close() })
	r := fake.New()
	m := core.New(r, s, network.Allocator{Store: s}, platform.FileLock{Path: filepath.Join(d, "lock")}, d, "test")
	return m, r, s
}
func server() spec.Server { s := spec.Defaults(); s.EULA = true; return s }
func TestLifecycleAndApply(t *testing.T) {
	m, r, s := setup(t)
	ctx := context.Background()
	v := server()
	rec, e := m.CreateServer(ctx, v)
	if e != nil {
		t.Fatal(e)
	}
	if rec.Status.State != "running" || rec.Spec.Network.Port == 0 {
		t.Fatal(rec)
	}
	if _, e = m.SendCommand(ctx, v.ID, "say hi"); e != nil {
		t.Fatal(e)
	}
	rec.Spec.Name = "Changed"
	if e = m.UpdateSpec(ctx, rec.Spec); e != nil {
		t.Fatal(e)
	}
	if e = m.Apply(ctx, v.ID); e != nil {
		t.Fatal(e)
	}
	next, e := s.GetServer(ctx, v.ID)
	if e != nil || next.Status.ContainerID == rec.Status.ContainerID {
		t.Fatal("not recreated", e)
	}
	if e = m.Stop(ctx, v.ID); e != nil {
		t.Fatal(e)
	}
	if _, e = m.SendCommand(ctx, v.ID, "list"); e == nil {
		t.Fatal("stopped server accepted command")
	}
	if e = m.Delete(ctx, v.ID, true); e != nil {
		t.Fatal(e)
	}
	if !r.Volumes[itzg.Volume(v.ID)] {
		t.Fatal("lost kept volume")
	}
	if _, e = s.GetPort(ctx, v.ID); e == nil {
		t.Fatal("port not released")
	}
	v = server()
	if _, e = m.CreateServer(ctx, v); e != nil {
		t.Fatal(e)
	}
	if e = m.Delete(ctx, v.ID, false); e != nil {
		t.Fatal(e)
	}
	if r.Volumes[itzg.Volume(v.ID)] {
		t.Fatal("volume not deleted")
	}
}
func TestFailedPullRetry(t *testing.T) {
	m, r, s := setup(t)
	ctx := context.Background()
	v := server()
	r.Failures["EnsureImage"] = fmt.Errorf("offline")
	if _, e := m.CreateServer(ctx, v); e == nil {
		t.Fatal("expected pull failure")
	}
	rec, e := s.GetServer(ctx, v.ID)
	if e != nil || rec.Status.Flag != "missing" {
		t.Fatal(rec, e)
	}
	delete(r.Failures, "EnsureImage")
	if e = m.Apply(ctx, v.ID); e != nil {
		t.Fatal(e)
	}
}
func TestConcurrentCreates(t *testing.T) {
	m, r, _ := setup(t)
	v := server()
	var wg sync.WaitGroup
	results := make(chan error, 2)
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); _, e := m.CreateServer(context.Background(), v); results <- e }()
	}
	wg.Wait()
	close(results)
	success := 0
	for e := range results {
		if e == nil {
			success++
		}
	}
	cs, _ := r.List(context.Background())
	if success != 1 || len(cs) != 1 {
		t.Fatal(success, len(cs))
	}
}
func TestReconcileCases(t *testing.T) {
	for _, mode := range []string{"missing", "orphan", "drift"} {
		t.Run(mode, func(t *testing.T) {
			m, r, s := setup(t)
			ctx := context.Background()
			v := server()
			rec, e := m.CreateServer(ctx, v)
			if e != nil {
				t.Fatal(e)
			}
			switch mode {
			case "missing":
				_ = r.Remove(ctx, rec.Status.ContainerID)
			case "orphan":
				_ = s.DeleteServer(ctx, v.ID)
			case "drift":
				rec.Spec.Name = "new desired name"
				_ = s.SaveServer(ctx, rec)
			}
			if e = m.Reconcile(ctx); e != nil {
				t.Fatal(e)
			}
			got, e := s.GetServer(ctx, v.ID)
			if e != nil {
				t.Fatal(e)
			}
			want := map[string]string{"missing": "missing", "orphan": "", "drift": "drifted"}[mode]
			if got.Status.Flag != want {
				t.Fatal(got.Status)
			}
			if mode != "missing" {
				cs, _ := r.List(ctx)
				if len(cs) != 1 {
					t.Fatal("reconcile removed container")
				}
			}
		})
	}
}
func TestWatchExternalStop(t *testing.T) {
	m, r, _ := setup(t)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	v := server()
	rec, e := m.CreateServer(ctx, v)
	if e != nil {
		t.Fatal(e)
	}
	stream := m.Subscribe(ctx)
	done := make(chan struct{})
	go func() { m.Watch(ctx); close(done) }()
	deadline := time.After(3 * time.Second)
	for {
		select {
		case e := <-stream:
			if e.Kind == events.Metrics {
				goto ready
			}
		case <-deadline:
			t.Fatal("watch did not start")
		}
	}
ready:
	r.Inject(runtime.Event{ServerID: v.ID, ContainerID: rec.Status.ContainerID, Action: "die", ExitCode: 1})
	for {
		select {
		case e := <-stream:
			if e.Kind == events.Crashed {
				rs, _ := m.List(ctx)
				if rs[0].Status.State != "exited" {
					t.Fatal(rs)
				}
				cancel()
				<-done
				return
			}
		case <-deadline:
			t.Fatal("no crash event")
		}
	}
}
func TestPreflightFailure(t *testing.T) {
	m, r, _ := setup(t)
	r.Failures["Ping"] = runtime.ErrPermission
	p, e := m.Preflight(context.Background())
	if e != nil || p.OK() {
		t.Fatal(p, e)
	}
}
