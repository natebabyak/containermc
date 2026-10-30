// Package store is the SQLite metadata cache adapter. Docker remains authoritative.
package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"sort"

	"containermc/db"
	"containermc/internal/network"
	"containermc/internal/spec"
	"containermc/internal/store/queries"
	"modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
	q  *queries.Queries
}

func Open(path string) (*Store, error) {
	u := url.URL{Scheme: "file", Path: path}
	v := u.Query()
	v.Add("_pragma", "busy_timeout(5000)")
	v.Add("_pragma", "journal_mode(WAL)")
	v.Add("_pragma", "foreign_keys(1)")
	u.RawQuery = v.Encode()
	d, err := sql.Open("sqlite", u.String())
	if err != nil {
		return nil, err
	}
	d.SetMaxOpenConns(1)
	s := &Store{db: d, q: queries.New(d)}
	if err = s.migrate(); err != nil {
		_ = d.Close()
		return nil, err
	}
	return s, nil
}
func (s *Store) migrate() error {
	ctx := context.Background()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)"); err != nil {
		return err
	}
	var version int
	err = tx.QueryRowContext(ctx, "SELECT version FROM schema_version LIMIT 1").Scan(&version)
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	entries, err := db.Migrations.ReadDir("migrations")
	if err != nil {
		return err
	}
	if version > len(entries) {
		return fmt.Errorf("cache schema %d is newer than this app supports", version)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	for i, e := range entries {
		if i+1 <= version {
			continue
		}
		b, err := db.Migrations.ReadFile("migrations/" + e.Name())
		if err != nil {
			return err
		}
		if _, err = tx.ExecContext(ctx, string(b)); err != nil {
			return fmt.Errorf("migration %s: %w", e.Name(), err)
		}
	}
	if _, err = tx.ExecContext(ctx, "DELETE FROM schema_version"); err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, "INSERT INTO schema_version VALUES (?)", len(entries)); err != nil {
		return err
	}
	return tx.Commit()
}
func (s *Store) Close() error { return s.db.Close() }
func (s *Store) SaveServer(ctx context.Context, r spec.Record) error {
	b, err := json.Marshal(r.Spec)
	if err != nil {
		return err
	}
	st, err := json.Marshal(r.Status)
	if err != nil {
		return err
	}
	return s.q.SaveServer(ctx, queries.SaveServerParams{ID: r.Spec.ID, Name: r.Spec.Name, Spec: b, Status: st})
}
func decode(r queries.Server) (spec.Record, error) {
	v, err := spec.Decode(r.Spec)
	if err != nil {
		return spec.Record{}, err
	}
	var status spec.Status
	err = json.Unmarshal(r.Status, &status)
	return spec.Record{Spec: v, Status: status}, err
}
func (s *Store) GetServer(ctx context.Context, id string) (spec.Record, error) {
	r, err := s.q.GetServer(ctx, id)
	if err != nil {
		return spec.Record{}, err
	}
	return decode(r)
}
func (s *Store) ListServers(ctx context.Context) ([]spec.Record, error) {
	rs, err := s.q.ListServers(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]spec.Record, 0, len(rs))
	for _, r := range rs {
		v, e := decode(r)
		if e != nil {
			return nil, e
		}
		out = append(out, v)
	}
	return out, nil
}
func (s *Store) DeleteServer(ctx context.Context, id string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	q := s.q.WithTx(tx)
	if err = q.DeleteServer(ctx, id); err != nil {
		return err
	}
	if err = q.ReleasePort(ctx, id); err != nil {
		return err
	}
	return tx.Commit()
}
func (s *Store) ReservePort(ctx context.Context, id string, port int) error {
	err := s.q.ReservePort(ctx, queries.ReservePortParams{Port: int64(port), ServerID: id})
	var sqlErr *sqlite.Error
	if errors.As(err, &sqlErr) && sqlErr.Code()&255 == 19 {
		return fmt.Errorf("%w: %v", network.ErrReserved, err)
	}
	return err
}
func (s *Store) ReleasePort(ctx context.Context, id string) error { return s.q.ReleasePort(ctx, id) }
func (s *Store) GetPort(ctx context.Context, id string) (int, error) {
	p, e := s.q.GetPort(ctx, id)
	return int(p), e
}
