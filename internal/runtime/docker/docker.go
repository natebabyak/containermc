// Package docker is the only adapter that imports the Docker Engine SDK.
package docker

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/netip"
	"strconv"
	"strings"
	"time"

	"containermc/internal/runtime"
	"github.com/containerd/errdefs"
	"github.com/moby/moby/api/pkg/stdcopy"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/mount"
	"github.com/moby/moby/api/types/network"
	"github.com/moby/moby/client"
)

type Runtime struct{ cli *client.Client }

func New(host string) (*Runtime, error) {
	c, err := client.New(client.FromEnv, client.WithHost(host))
	if err != nil {
		return nil, err
	}
	return &Runtime{cli: c}, nil
}
func (r *Runtime) Close() error { return r.cli.Close() }
func mapped(err error) error {
	if err == nil {
		return nil
	}
	kind := error(nil)
	switch {
	case errdefs.IsNotFound(err):
		kind = runtime.ErrNotFound
	case strings.Contains(strings.ToLower(err.Error()), "port is already allocated"), strings.Contains(err.Error(), "address already in use"):
		kind = runtime.ErrPortInUse
	case errdefs.IsConflict(err):
		kind = runtime.ErrConflict
	case errdefs.IsPermissionDenied(err), strings.Contains(err.Error(), "permission denied"):
		kind = runtime.ErrPermission
	}
	if kind != nil {
		return fmt.Errorf("%w: %v", kind, err)
	}
	return err
}
func (r *Runtime) Ping(ctx context.Context) (runtime.EngineInfo, error) {
	_, err := r.cli.Ping(ctx, client.PingOptions{})
	if err != nil {
		return runtime.EngineInfo{}, mapped(err)
	}
	v, err := r.cli.Info(ctx, client.InfoOptions{})
	if err != nil {
		return runtime.EngineInfo{}, mapped(err)
	}
	i := v.Info
	return runtime.EngineInfo{Name: i.OperatingSystem, Version: i.ServerVersion, API: r.cli.ClientVersion(), OS: i.OSType, Arch: i.Architecture, MemoryBytes: i.MemTotal, CPUs: i.NCPU, Unsupported: strings.Contains(strings.ToLower(i.OperatingSystem+" "+i.ServerVersion), "podman")}, nil
}
func (r *Runtime) EnsureImage(ctx context.Context, image string, progress func(string)) error {
	_, err := r.cli.ImageInspect(ctx, image)
	if err == nil {
		return nil
	}
	if !errdefs.IsNotFound(err) {
		return mapped(err)
	}
	if progress != nil {
		progress("Pulling " + image)
	}
	pull, err := r.cli.ImagePull(ctx, image, client.ImagePullOptions{})
	if err != nil {
		return mapped(err)
	}
	defer pull.Close()
	if progress == nil {
		return mapped(pull.Wait(ctx))
	}
	last := time.Time{}
	for message, err := range pull.JSONMessages(ctx) {
		if err != nil {
			return mapped(err)
		}
		if message.Error != nil {
			return fmt.Errorf("pull image: %s", message.Error.Message)
		}
		if time.Since(last) > 200*time.Millisecond {
			counts := ""
			if message.Progress != nil && message.Progress.Total > 0 {
				counts = fmt.Sprintf(" %d/%d bytes", message.Progress.Current, message.Progress.Total)
			}
			progress(strings.TrimSpace(message.ID + " " + message.Status + counts))
			last = time.Now()
		}
	}
	return nil
}
func (r *Runtime) EnsureVolume(ctx context.Context, name string, labels map[string]string) error {
	_, err := r.cli.VolumeCreate(ctx, client.VolumeCreateOptions{Name: name, Labels: labels})
	return mapped(err)
}
func (r *Runtime) RemoveVolume(ctx context.Context, name string) error {
	_, err := r.cli.VolumeRemove(ctx, name, client.VolumeRemoveOptions{})
	return mapped(err)
}
func (r *Runtime) Create(ctx context.Context, s runtime.ContainerSpec) (string, error) {
	p := network.MustParsePort(strconv.Itoa(s.ContainerPort) + "/tcp")
	id, err := r.cli.ContainerCreate(ctx, client.ContainerCreateOptions{Name: s.Name, Config: &container.Config{Cmd: s.Command, Image: s.Image, Env: s.Env, Labels: s.Labels, ExposedPorts: network.PortSet{p: {}}}, HostConfig: &container.HostConfig{Mounts: []mount.Mount{{Type: mount.TypeVolume, Source: s.Volume, Target: "/data"}}, PortBindings: network.PortMap{p: []network.PortBinding{{HostIP: netip.MustParseAddr(s.HostIP), HostPort: strconv.Itoa(s.HostPort)}}}, Resources: container.Resources{Memory: s.MemoryBytes, NanoCPUs: s.NanoCPUs, PidsLimit: &s.PIDs}, RestartPolicy: container.RestartPolicy{Name: container.RestartPolicyMode(s.Restart)}, CapDrop: s.CapDrop, SecurityOpt: []string{"no-new-privileges:true"}, LogConfig: container.LogConfig{Type: "json-file", Config: map[string]string{"max-size": "10m", "max-file": "3"}}}})
	return id.ID, mapped(err)
}
func (r *Runtime) Start(ctx context.Context, id string) error {
	_, e := r.cli.ContainerStart(ctx, id, client.ContainerStartOptions{})
	return mapped(e)
}
func (r *Runtime) Stop(ctx context.Context, id string) error {
	n := 60
	_, e := r.cli.ContainerStop(ctx, id, client.ContainerStopOptions{Timeout: &n})
	return mapped(e)
}

// Kill is used by integration tooling to simulate an external crash.
// Normal application shutdown always uses Stop's graceful timeout.
func (r *Runtime) Kill(ctx context.Context, id string) error {
	_, err := r.cli.ContainerKill(ctx, id, client.ContainerKillOptions{Signal: "SIGKILL"})
	return mapped(err)
}
func (r *Runtime) Remove(ctx context.Context, id string) error {
	_, e := r.cli.ContainerRemove(ctx, id, client.ContainerRemoveOptions{})
	return mapped(e)
}
func (r *Runtime) List(ctx context.Context) ([]runtime.Container, error) {
	cs, err := r.cli.ContainerList(ctx, client.ContainerListOptions{All: true, Filters: client.Filters{}.Add("label", "app.server-id")})
	if err != nil {
		return nil, mapped(err)
	}
	out := make([]runtime.Container, 0, len(cs.Items))
	for _, c := range cs.Items {
		out = append(out, runtime.Container{ID: c.ID, Name: strings.Join(c.Names, ","), State: string(c.State), Labels: c.Labels})
	}
	return out, nil
}
func (r *Runtime) Logs(ctx context.Context, id string, follow bool) (<-chan runtime.LogLine, error) {
	body, err := r.cli.ContainerLogs(ctx, id, client.ContainerLogsOptions{ShowStdout: true, ShowStderr: true, Follow: follow, Tail: "200", Timestamps: true})
	if err != nil {
		return nil, mapped(err)
	}
	out := make(chan runtime.LogLine, 256)
	pr, pw := io.Pipe()
	go func() { defer body.Close(); _, e := stdcopy.StdCopy(pw, pw, body); _ = pw.CloseWithError(e) }()
	go func() {
		defer close(out)
		defer pr.Close()
		scan := bufio.NewScanner(pr)
		scan.Buffer(make([]byte, 4096), 1024*1024)
		for scan.Scan() {
			line := scan.Text()
			t := time.Now()
			if stamp, rest, ok := strings.Cut(line, " "); ok {
				if parsed, e := time.Parse(time.RFC3339Nano, stamp); e == nil {
					t = parsed
					line = rest
				}
			}
			select {
			case out <- runtime.LogLine{Time: t, Text: line}:
			case <-ctx.Done():
				return
			}
		}
		if e := scan.Err(); e != nil && ctx.Err() == nil {
			select {
			case out <- runtime.LogLine{Err: e}:
			case <-ctx.Done():
			}
		}
	}()
	return out, nil
}
func (r *Runtime) Stats(ctx context.Context, id string) (<-chan runtime.Stats, error) {
	response, err := r.cli.ContainerStats(ctx, id, client.ContainerStatsOptions{Stream: true})
	if err != nil {
		return nil, mapped(err)
	}
	out := make(chan runtime.Stats, 1)
	go func() {
		defer response.Body.Close()
		defer close(out)
		dec := json.NewDecoder(response.Body)
		for {
			var s container.StatsResponse
			if err := dec.Decode(&s); err != nil {
				if ctx.Err() == nil && !errors.Is(err, io.EOF) {
					select {
					case out <- runtime.Stats{Err: err}:
					case <-ctx.Done():
					}
				}
				return
			}
			v := runtime.Stats{MemoryUsed: s.MemoryStats.Usage, MemoryLimit: s.MemoryStats.Limit}
			if cache := s.MemoryStats.Stats["inactive_file"]; cache < v.MemoryUsed {
				v.MemoryUsed -= cache
			}
			cpu := float64(s.CPUStats.CPUUsage.TotalUsage) - float64(s.PreCPUStats.CPUUsage.TotalUsage)
			system := float64(s.CPUStats.SystemUsage) - float64(s.PreCPUStats.SystemUsage)
			if cpu >= 0 && system > 0 {
				v.CPUPercent = cpu / system * float64(s.CPUStats.OnlineCPUs) * 100
			}
			for _, n := range s.Networks {
				v.NetworkRX += n.RxBytes
				v.NetworkTX += n.TxBytes
			}
			select {
			case out <- v:
			case <-ctx.Done():
				return
			default:
				select {
				case <-out:
				default:
				}
				select {
				case out <- v:
				default:
				}
			}
		}
	}()
	return out, nil
}
func (r *Runtime) Exec(ctx context.Context, id string, args []string) (string, error) {
	e, err := r.cli.ExecCreate(ctx, id, client.ExecCreateOptions{Cmd: args, AttachStdout: true, AttachStderr: true})
	if err != nil {
		return "", mapped(err)
	}
	a, err := r.cli.ExecAttach(ctx, e.ID, client.ExecAttachOptions{})
	if err != nil {
		return "", mapped(err)
	}
	defer a.Close()
	done := make(chan struct{})
	defer close(done)
	go func() {
		select {
		case <-ctx.Done():
			a.Close()
		case <-done:
		}
	}()
	var b bytes.Buffer
	if _, err = stdcopy.StdCopy(&b, &b, a.Reader); err != nil {
		return b.String(), mapped(err)
	}
	st, err := r.cli.ExecInspect(ctx, e.ID, client.ExecInspectOptions{})
	if err != nil {
		return b.String(), mapped(err)
	}
	if st.ExitCode != 0 {
		return b.String(), fmt.Errorf("console exited %d: %s (RCON may still be starting)", st.ExitCode, b.String())
	}
	return b.String(), nil
}
func (r *Runtime) Events(ctx context.Context) <-chan runtime.Event {
	out := make(chan runtime.Event, 128)
	go func() {
		defer close(out)
		since := time.Now().Format(time.RFC3339Nano)
		for ctx.Err() == nil {
			streamCtx, cancel := context.WithCancel(ctx)
			stream := r.cli.Events(streamCtx, client.EventsListOptions{Since: since, Filters: client.Filters{}.Add("label", "app.server-id").Add("type", "container")})
		read:
			for {
				select {
				case <-ctx.Done():
					cancel()
					return
				case e := <-stream.Messages:
					since = time.Unix(0, e.TimeNano).Add(time.Nanosecond).Format(time.RFC3339Nano)
					code, _ := strconv.Atoi(e.Actor.Attributes["exitCode"])
					v := runtime.Event{ServerID: e.Actor.Attributes["app.server-id"], ContainerID: e.Actor.ID, Action: string(e.Action), ExitCode: code}
					select {
					case out <- v:
					case <-ctx.Done():
						cancel()
						return
					}
				case err := <-stream.Err:
					if err != nil && ctx.Err() == nil {
						select {
						case out <- runtime.Event{Err: err}:
						default:
						}
					}
					break read
				}
			}
			cancel()
			select {
			case <-time.After(time.Second):
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}
