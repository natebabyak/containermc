package store

import (
	"context"
	"database/sql"
	"path/filepath"
	"sync"
	"testing"

	"containermc/db"
	"containermc/internal/spec"
)

func TestMigrationAndRoundTrip(t *testing.T) {
	p := filepath.Join(t.TempDir(), "cache.db")
	d, e := sql.Open("sqlite", p)
	if e != nil {
		t.Fatal(e)
	}
	old, _ := db.Migrations.ReadFile("migrations/001_initial.sql")
	if _, e = d.Exec(string(old) + "; CREATE TABLE schema_version(version INTEGER); INSERT INTO schema_version VALUES (1);"); e != nil {
		t.Fatal(e)
	}
	_ = d.Close()
	s, e := Open(p)
	if e != nil {
		t.Fatal(e)
	}
	defer s.Close()
	ctx := context.Background()
	r := spec.Record{Spec: spec.Defaults(), Status: spec.Status{State: "missing"}}
	if e = s.SaveServer(ctx, r); e != nil {
		t.Fatal(e)
	}
	got, e := s.GetServer(ctx, r.Spec.ID)
	if e != nil || spec.Hash(r.Spec) != spec.Hash(got.Spec) {
		t.Fatal(got, e)
	}
	var v int
	if e = s.db.QueryRow("SELECT version FROM schema_version").Scan(&v); e != nil || v != 2 {
		t.Fatal(v, e)
	}
	if _, e = s.db.Exec("INSERT INTO exposure VALUES (?,?)", r.Spec.ID, []byte(`{}`)); e != nil {
		t.Fatal(e)
	}
}
func TestConcurrentReservations(t *testing.T) {
	p := filepath.Join(t.TempDir(), "cache.db")
	a, e := Open(p)
	if e != nil {
		t.Fatal(e)
	}
	defer a.Close()
	b, e := Open(p)
	if e != nil {
		t.Fatal(e)
	}
	defer b.Close()
	ctx := context.Background()
	var wg sync.WaitGroup
	results := make(chan error, 2)
	for i, s := range []*Store{a, b} {
		wg.Add(1)
		go func(i int, s *Store) {
			defer wg.Done()
			results <- s.ReservePort(ctx, []string{"one", "two"}[i], 25565)
		}(i, s)
	}
	wg.Wait()
	close(results)
	success := 0
	for e := range results {
		if e == nil {
			success++
		}
	}
	if success != 1 {
		t.Fatal("expected exactly one reservation", success)
	}
	for _, id := range []string{"one", "two"} {
		if e = a.DeleteServer(ctx, id); e != nil {
			t.Fatal(e)
		}
	}
	if e = b.ReservePort(ctx, "three", 25565); e != nil {
		t.Fatal(e)
	}
}
