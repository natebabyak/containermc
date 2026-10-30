package spec

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestValidation(t *testing.T) {
	for _, tc := range []struct {
		name, field string
		edit        func(*Server)
	}{
		{"valid", "", func(s *Server) {}}, {"name", "name", func(s *Server) { s.Name = "\x1b" }}, {"version", "version", func(s *Server) { s.Version = "LATEST" }}, {"heap", "resources.heapMiB", func(s *Server) { s.Resources.HeapMiB = 128 }}, {"overhead", "resources.memoryMiB", func(s *Server) { s.Resources.MemoryMiB = 2048 }}, {"port", "network.port", func(s *Server) { s.Network.Port = 65536 }}, {"eula", "eula", func(s *Server) { s.EULA = false }}, {"pin", "mods", func(s *Server) { s.Mods = []Mod{{Project: "lithium"}} }},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := Defaults()
			s.EULA = true
			tc.edit(&s)
			err := Validate(s)
			if tc.field == "" {
				if err != nil {
					t.Fatal(err)
				}
			} else if err == nil || !strings.Contains(err.Error(), tc.field+":") {
				t.Fatalf("expected field %s, got %v", tc.field, err)
			}
		})
	}
}
func TestHashRoundTrip(t *testing.T) {
	s := Defaults()
	b, _ := json.Marshal(s)
	v, e := Decode(b)
	if e != nil || Hash(s) != Hash(v) {
		t.Fatal("hash changed after roundtrip", e)
	}
	v.Name = "different"
	if Hash(s) == Hash(v) {
		t.Fatal("hash ignored change")
	}
	if _, e := Decode([]byte(`{"apiVersion":"future"}`)); e == nil {
		t.Fatal("unknown schema accepted")
	}
}
