package test

import (
	"go/parser"
	"go/token"
	"io/fs"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestImportBoundaries(t *testing.T) {
	root := filepath.Join("..", "internal")
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || !strings.HasSuffix(path, ".go") {
			return nil
		}
		f, e := parser.ParseFile(token.NewFileSet(), path, nil, parser.ImportsOnly)
		if e != nil {
			return e
		}
		relative, _ := filepath.Rel(root, path)
		slash := filepath.ToSlash(relative)
		for _, i := range f.Imports {
			imp, _ := strconv.Unquote(i.Path.Value)
			if strings.HasPrefix(imp, "github.com/moby/") && !strings.HasPrefix(slash, "runtime/docker/") {
				t.Errorf("Docker SDK outside adapter: %s", path)
			}
			if strings.HasPrefix(slash, "core/") && (imp == "database/sql" || strings.HasPrefix(imp, "charm.land/") || imp == "modernc.org/sqlite") {
				t.Errorf("core boundary: %s imports %s", path, imp)
			}
			if strings.HasPrefix(slash, "tui/") && (imp == "database/sql" || strings.HasPrefix(imp, "containermc/internal/store") || strings.HasPrefix(imp, "containermc/internal/runtime") || imp == "modernc.org/sqlite") {
				t.Errorf("TUI boundary: %s imports %s", path, imp)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
