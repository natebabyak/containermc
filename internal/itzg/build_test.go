package itzg

import (
	"encoding/json"
	"flag"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"containermc/internal/spec"
)

var update = flag.Bool("update", false, "update golden files")

func TestBuildGolden(t *testing.T) {
	for _, name := range []string{"vanilla", "paper", "fabric", "lan", "shared", "java25", "java17", "java8"} {
		t.Run(name, func(t *testing.T) {
			s := spec.Defaults()
			s.ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV"
			s.EULA = true
			s.Network.Port = 25565
			s.Network.Share = false
			s.Network.LAN = false
			switch name {
			case "paper":
				s.Loader = "PAPER"
				s.Plugins = []spec.Mod{{Project: "plugin", Version: "pinned"}}
			case "fabric":
				s.Loader = "FABRIC"
				s.Mods = []spec.Mod{{Project: "lithium", Version: "pinned"}}
			case "lan":
				s.Network.LAN = true
			case "shared":
				s.Network.Share = true
			case "java25":
				s.Version = "26.1"
			case "java17":
				s.Version = "1.20.4"
			case "java8":
				s.Version = "1.16.5"
			}
			got, e := Build(s, "test")
			if e != nil {
				t.Fatal(e)
			}
			b, _ := json.MarshalIndent(got, "", "  ")
			b = append(b, '\n')
			path := filepath.Join("testdata", name+".json")
			if *update {
				if e = os.MkdirAll("testdata", 0755); e != nil {
					t.Fatal(e)
				}
				if e = os.WriteFile(path, b, 0644); e != nil {
					t.Fatal(e)
				}
			}
			want, e := os.ReadFile(path)
			if e != nil {
				t.Fatal(e)
			}
			if string(want) != string(b) {
				t.Fatalf("mapping changed; run go test ./internal/itzg -update to review")
			}
			again, _ := Build(s, "test")
			other, _ := json.MarshalIndent(again, "", "  ")
			if strings.TrimSpace(string(b)) != string(other) {
				t.Fatal("non-deterministic mapping")
			}
			if got.MemoryBytes != 3072<<20 || got.PIDs != 512 {
				t.Fatal("limits missing")
			}
		})
	}
}
