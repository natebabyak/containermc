package platform

import (
	"context"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestDataPaths(t *testing.T) {
	env := func(k string) string {
		switch k {
		case "LOCALAPPDATA":
			return "local"
		case "XDG_DATA_HOME":
			return "xdg"
		}
		return ""
	}
	for _, tc := range []struct{ os, want string }{{"darwin", filepath.Join("home", "Library", "Application Support", "ContainerMC")}, {"linux", filepath.Join("xdg", "containermc")}, {"windows", filepath.Join("local", "ContainerMC")}} {
		if got := DataDirFor(tc.os, "home", env); got != tc.want {
			t.Fatal(tc.os, got)
		}
	}
}
func TestLockContention(t *testing.T) {
	l := FileLock{Path: filepath.Join(t.TempDir(), "lock")}
	unlock, e := l.Acquire(context.Background(), "server")
	if e != nil {
		t.Fatal(e)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 80*time.Millisecond)
	defer cancel()
	_, e = l.Acquire(ctx, "server")
	if e == nil || !strings.Contains(e.Error(), "PID") {
		t.Fatal(e)
	}
	unlock()
	unlock, e = l.Acquire(context.Background(), "server")
	if e != nil {
		t.Fatal(e)
	}
	unlock()
}
