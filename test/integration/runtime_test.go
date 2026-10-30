//go:build integration

package integration

import (
	"containermc/internal/platform"
	"containermc/internal/runtime/contracttest"
	"containermc/internal/runtime/docker"
	"testing"
)

// This contract uses Alpine with a shell process, so it does not accept Minecraft's EULA.
func TestDockerContract(t *testing.T) {
	r, e := docker.New(platform.EngineHost())
	if e != nil {
		t.Fatal(e)
	}
	defer r.Close()
	contracttest.Run(t, r, "alpine:3.22")
}
