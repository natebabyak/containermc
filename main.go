package main

import (
	"context"
	"fmt"
	"log"
	"net/netip"
	"os"

	"github.com/containerd/errdefs"
	"github.com/moby/moby/api/pkg/stdcopy"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/mount"
	"github.com/moby/moby/api/types/network"
	"github.com/moby/moby/client"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	ctx := context.Background()

	cli, err := client.New(client.FromEnv)
	if err != nil {
		return err
	}
	defer cli.Close()

	const name = "mc-survival"
	const image = "itzg/minecraft-server:latest"

	existing, err := cli.ContainerInspect(ctx, name, client.ContainerInspectOptions{})
	switch {
	case err == nil:
		fmt.Println("Using existing server:", existing.Container.ID)

	case errdefs.IsNotFound(err):
		fmt.Println("Pulling Minecraft server image...")

		pull, err := cli.ImagePull(ctx, image, client.ImagePullOptions{})
		if err != nil {
			return err
		}
		err = pull.Wait(ctx)
		pull.Close()
		if err != nil {
			return err
		}

		_, err = cli.VolumeCreate(ctx, client.VolumeCreateOptions{
			Name: name + "-data",
		})
		if err != nil {
			return err
		}

		port := network.MustParsePort("25565/tcp")

		_, err = cli.ContainerCreate(ctx, client.ContainerCreateOptions{
			Name: name,
			Config: &container.Config{
				Image: image,
				Env: []string{
					"EULA=TRUE", // Set only if you accept Minecraft's EULA.
					"MEMORY=2G",
					"VERSION=1.21.1",
				},
			},
			HostConfig: &container.HostConfig{
				Mounts: []mount.Mount{
					{
						Type:   mount.TypeVolume,
						Source: name + "-data",
						Target: "/data",
					},
				},
				PortBindings: network.PortMap{
					port: {
						{
							HostIP:   netip.MustParseAddr("127.0.0.1"),
							HostPort: "25565",
						},
					},
				},
			},
		})
		if err != nil {
			return err
		}

	default:
		return err
	}

	if _, err := cli.ContainerStart(ctx, name, client.ContainerStartOptions{}); err != nil {
		return err
	}

	logs, err := cli.ContainerLogs(ctx, name, client.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     true,
		Tail:       "50",
	})
	if err != nil {
		return err
	}
	defer logs.Close()

	fmt.Println("Once ready, join localhost:25565")
	_, err = stdcopy.StdCopy(os.Stdout, os.Stderr, logs)
	return err
}
