// Package itzg maps specs to container configuration without I/O.
package itzg

import (
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"containermc/internal/runtime"
	"containermc/internal/spec"
)

const Java21Image = "itzg/minecraft-server:java21-alpine@sha256:6a254535fa6768ae72242df1841344bdeda088838b511ea30373709dff08f6c8"
const Java25Image = "itzg/minecraft-server:java25-alpine@sha256:76c96d37fe9a37de28e22807eac03850967b4ea21fd4bc19a227a827c397dffd"
const Java17Image = "itzg/minecraft-server:java17@sha256:a08cd9ced3e1c3f46a318af1fa393de21698afbf8746681f115dc923ba847ba5"
const Java8Image = "itzg/minecraft-server:java8@sha256:73cfcc725460c74ce9b66250e417d1eff5dc53ce95308ce07bca21972d4a87f3"

func Volume(id string) string { return "containermc-" + id + "-data" }
func Image(s spec.Server) (string, error) {
	if s.Image != "" {
		return s.Image, nil
	}
	parts := strings.Split(s.Version, ".")
	major, _ := strconv.Atoi(parts[0])
	minor := 0
	patch := 0
	if len(parts) > 1 {
		minor, _ = strconv.Atoi(parts[1])
	}
	if len(parts) > 2 {
		patch, _ = strconv.Atoi(parts[2])
	}
	if major >= 26 {
		return Java25Image, nil
	}
	if major == 1 && (minor > 20 || (minor == 20 && patch >= 5)) {
		return Java21Image, nil
	}
	if major == 1 && minor >= 17 {
		return Java17Image, nil
	}
	return Java8Image, nil
}
func Build(s spec.Server, appVersion string) (runtime.ContainerSpec, error) {
	if err := spec.Validate(s); err != nil {
		return runtime.ContainerSpec{}, err
	}
	image, err := Image(s)
	if err != nil {
		return runtime.ContainerSpec{}, err
	}
	b, _ := json.Marshal(s)
	env := []string{"EULA=TRUE", "TYPE=" + s.Loader, "VERSION=" + s.Version, fmt.Sprintf("MEMORY=%dM", s.Resources.HeapMiB), "ONLINE_MODE=TRUE", "ENABLE_RCON=TRUE", "ENABLE_WHITELIST=" + strconv.FormatBool(s.Properties.Whitelist), "WHITELIST=" + strings.Join(s.Properties.Players, ","), "OPS=" + strings.Join(s.Properties.Ops, ","), "DIFFICULTY=" + s.Properties.Difficulty, "MOTD=" + s.Properties.MOTD}
	var mods []string
	for _, m := range append(append([]spec.Mod{}, s.Mods...), s.Plugins...) {
		mods = append(mods, m.Project+":"+m.Version)
	}
	sort.Strings(mods)
	if len(mods) > 0 {
		env = append(env, "MODRINTH_PROJECTS="+strings.Join(mods, ","))
	}
	sort.Strings(env)
	labels := map[string]string{"app.server-id": s.ID, "app.spec-hash": spec.Hash(s), "app.version": appVersion, "app.spec": string(b)}
	if s.Network.Hostname != "" {
		labels["mc-router.host"] = s.Network.Hostname
	}
	host := "127.0.0.1"
	if s.Network.LAN {
		host = "0.0.0.0"
	}
	// itzg's root entrypoint needs these to initialise /data and switch to its UID.
	// Keep CHOWN, DAC_OVERRIDE, FOWNER, SETUID, SETGID; drop unrelated defaults.
	return runtime.ContainerSpec{ContainerPort: 25565, Name: "containermc-" + s.ID, Image: image, Volume: Volume(s.ID), Env: env, Labels: labels, HostIP: host, HostPort: s.Network.Port, MemoryBytes: int64(s.Resources.MemoryMiB) * 1024 * 1024, NanoCPUs: int64(s.Resources.CPUs * 1e9), PIDs: 512, Restart: s.Restart, CapDrop: []string{"AUDIT_WRITE", "FSETID", "KILL", "MKNOD", "NET_BIND_SERVICE", "NET_RAW", "SETFCAP", "SETPCAP", "SYS_CHROOT"}}, nil
}
