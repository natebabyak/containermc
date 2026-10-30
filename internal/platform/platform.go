package platform

import (
	"context"
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/gofrs/flock"
)

func DataDirFor(goos, home string, env func(string) string) string {
	switch goos {
	case "darwin":
		return filepath.Join(home, "Library", "Application Support", "ContainerMC")
	case "windows":
		return filepath.Join(env("LOCALAPPDATA"), "ContainerMC")
	default:
		if d := env("XDG_DATA_HOME"); d != "" {
			return filepath.Join(d, "containermc")
		}
		return filepath.Join(home, ".local", "share", "containermc")
	}
}
func DataDir() (string, error) {
	if dir := os.Getenv("CONTAINERMC_DATA_DIR"); dir != "" {
		return dir, os.MkdirAll(dir, 0700)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	d := DataDirFor(runtime.GOOS, home, os.Getenv)
	return d, os.MkdirAll(d, 0700)
}
func EngineHost() string {
	if v := os.Getenv("DOCKER_HOST"); v != "" {
		return v
	}
	if runtime.GOOS == "windows" {
		return "npipe:////./pipe/docker_engine"
	}
	home, _ := os.UserHomeDir()
	for _, p := range []string{filepath.Join(home, ".docker", "run", "docker.sock"), filepath.Join(home, ".docker", "desktop", "docker.sock"), "/var/run/docker.sock"} {
		if _, err := os.Stat(p); err == nil {
			return "unix://" + p
		}
	}
	return "unix:///var/run/docker.sock"
}

type Locker interface {
	Acquire(context.Context, string) (func(), error)
}
type FileLock struct{ Path string }

func (l FileLock) Acquire(ctx context.Context, key string) (func(), error) {
	l.Path += fmt.Sprintf(".%x", sha256.Sum256([]byte(key)))
	f := flock.New(l.Path)
	wait, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	ok, err := f.TryLockContext(wait, 50*time.Millisecond)
	if err != nil || !ok {
		pid, _ := os.ReadFile(l.Path + ".pid")
		return nil, fmt.Errorf("another ContainerMC operation holds the lock (PID %s): %w", pid, wait.Err())
	}
	if err = os.WriteFile(l.Path+".pid", []byte(fmt.Sprint(os.Getpid())), 0600); err != nil {
		_ = f.Unlock()
		return nil, err
	}
	return func() { _ = os.Remove(l.Path + ".pid"); _ = f.Unlock() }, nil
}
