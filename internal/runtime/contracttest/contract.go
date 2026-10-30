// Package contracttest exercises the same lifecycle and streaming contract on each adapter.
package contracttest

import (
	"context"
	"strings"
	"testing"
	"time"

	"containermc/internal/runtime"
	"github.com/oklog/ulid/v2"
)

func Run(t *testing.T, r runtime.Runtime, image string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	i, e := r.Ping(ctx)
	if e != nil || i.OS == "" {
		t.Fatal(i, e)
	}
	if e = r.EnsureImage(ctx, image, nil); e != nil {
		t.Fatal(e)
	}
	serverID := ulid.Make().String()
	name := "containermc-test-" + strings.ToLower(serverID)
	labels := map[string]string{"app.server-id": serverID, "app.test": "true"}
	if e = r.EnsureVolume(ctx, name, labels); e != nil {
		t.Fatal(e)
	}
	defer func() {
		cleanup, c := context.WithTimeout(context.Background(), 30*time.Second)
		defer c()
		if e := r.RemoveVolume(cleanup, name); e != nil {
			t.Error(e)
		}
	}()
	eventsCtx, eventsCancel := context.WithCancel(ctx)
	defer eventsCancel()
	events := r.Events(eventsCtx)
	id, e := r.Create(ctx, runtime.ContainerSpec{Name: name, Image: image, Volume: name, Command: []string{"sh", "-c", "echo 'runtime contract ready'; while :; do sleep 1; done"}, Labels: labels, HostIP: "127.0.0.1", ContainerPort: 8080, HostPort: 0, MemoryBytes: 256 << 20, PIDs: 64, Restart: "no"})
	if e != nil {
		t.Fatal(e)
	}
	defer func() {
		cleanup, c := context.WithTimeout(context.Background(), 30*time.Second)
		defer c()
		_ = r.Stop(cleanup, id)
		if e := r.Remove(cleanup, id); e != nil {
			t.Error(e)
		}
	}()
	if e = r.Start(ctx, id); e != nil {
		t.Fatal(e)
	}
	logsCtx, logsCancel := context.WithCancel(ctx)
	defer logsCancel()
	logs, e := r.Logs(logsCtx, id, true)
	if e != nil {
		t.Fatal(e)
	}
	select {
	case line := <-logs:
		if line.Err != nil || !strings.Contains(line.Text, "runtime contract ready") {
			t.Fatal(line)
		}
	case <-ctx.Done():
		t.Fatal("no logs")
	}
	statsCtx, statsCancel := context.WithCancel(ctx)
	defer statsCancel()
	stats, e := r.Stats(statsCtx, id)
	if e != nil {
		t.Fatal(e)
	}
	select {
	case v := <-stats:
		if v.Err != nil || v.MemoryLimit == 0 {
			t.Fatal(v)
		}
	case <-ctx.Done():
		t.Fatal("no stats")
	}
	output, e := r.Exec(ctx, id, []string{"sh", "-c", "echo contract-exec"})
	if e != nil || !strings.Contains(output, "contract-exec") {
		t.Fatal(output, e)
	}
	cs, e := r.List(ctx)
	if e != nil {
		t.Fatal(e)
	}
	found := false
	for _, v := range cs {
		if v.ID == id && v.Labels["app.server-id"] == serverID && v.State == "running" {
			found = true
		}
	}
	if !found {
		t.Fatal("running container not listed")
	}
	if e = r.Stop(ctx, id); e != nil {
		t.Fatal(e)
	}
	seen := false
	deadline := time.After(5 * time.Second)
	for !seen {
		select {
		case v := <-events:
			if v.ContainerID == id && v.Action == "die" {
				seen = true
			}
		case <-deadline:
			t.Fatal("no stop event")
		}
	}
	logsCancel()
	statsCancel()
	eventsCancel()
	for name, wait := range map[string]func(){"logs": func() {
		for range logs {
		}
	}, "stats": func() {
		for range stats {
		}
	}, "events": func() {
		for range events {
		}
	}} {
		done := make(chan struct{})
		go func() { wait(); close(done) }()
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			t.Fatalf("%s stream did not close on cancellation", name)
		}
	}
}
