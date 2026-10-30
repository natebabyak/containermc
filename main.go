package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"

	"containermc/internal/core"
	"containermc/internal/network"
	"containermc/internal/platform"
	"containermc/internal/runtime/docker"
	"containermc/internal/store"
	"containermc/internal/tui"
)

var version = "dev"

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	showVersion := flag.Bool("version", false, "print version")
	flag.Parse()
	if *showVersion {
		fmt.Println(version)
		return nil
	}
	if flag.NArg() != 0 {
		return fmt.Errorf("run ContainerMC without subcommands")
	}
	dir, err := platform.DataDir()
	if err != nil {
		return err
	}
	f, err := os.OpenFile(filepath.Join(dir, "app.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer f.Close()
	slog.SetDefault(slog.New(slog.NewJSONHandler(f, nil)))
	st, err := store.Open(filepath.Join(dir, "containermc.db"))
	if err != nil {
		return err
	}
	defer st.Close()
	rt, err := docker.New(platform.EngineHost())
	if err != nil {
		return err
	}
	defer rt.Close()
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()
	svc := core.New(rt, st, network.Allocator{Store: st}, platform.FileLock{Path: filepath.Join(dir, "operation.lock")}, dir, version)
	watchDone := make(chan struct{})
	go func() { svc.Watch(ctx); close(watchDone) }()
	defer func() { cancel(); <-watchDone }()
	return tui.Run(ctx, svc)
}
