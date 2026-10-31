// Package spec defines the portable, versioned server configuration.
package spec

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"strings"

	"github.com/oklog/ulid/v2"
)

const APIVersion = "v1alpha1"

type Resources struct {
	HeapMiB   int     `json:"heapMiB"`
	MemoryMiB int     `json:"memoryMiB"`
	CPUs      float64 `json:"cpus,omitempty"`
}
type Network struct {
	Port     int    `json:"port"`
	LAN      bool   `json:"lan"`
	Share    bool   `json:"share"`
	Hostname string `json:"hostname,omitempty"`
}
type Properties struct {
	Difficulty string   `json:"difficulty"`
	MOTD       string   `json:"motd"`
	Whitelist  bool     `json:"whitelist"`
	Players    []string `json:"players,omitempty"`
	Ops        []string `json:"ops,omitempty"`
}
type Mod struct {
	Project string `json:"project"`
	Version string `json:"version"`
}
type Server struct {
	APIVersion string     `json:"apiVersion"`
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Loader     string     `json:"loader"`
	Version    string     `json:"version"`
	Image      string     `json:"image,omitempty"`
	Resources  Resources  `json:"resources"`
	Network    Network    `json:"network"`
	Properties Properties `json:"properties"`
	Mods       []Mod      `json:"mods,omitempty"`
	Plugins    []Mod      `json:"plugins,omitempty"`
	Restart    string     `json:"restart"`
	EULA       bool       `json:"eula"`
}
type Status struct {
	ContainerID string `json:"containerID"`
	State       string `json:"state"`
	Flag        string `json:"flag,omitempty"`
}
type Record struct {
	Spec   Server `json:"spec"`
	Status Status `json:"status"`
}

func Defaults() Server {
	return Server{APIVersion: APIVersion, ID: ulid.Make().String(), Name: "My server", Loader: "VANILLA", Version: "1.21.1", Resources: Resources{HeapMiB: 2048, MemoryMiB: 3072}, Network: Network{LAN: true, Share: true}, Properties: Properties{Difficulty: "normal", MOTD: "A ContainerMC server"}, Restart: "unless-stopped", EULA: true}
}

type FieldError struct{ Field, Message string }
type ValidationErrors []FieldError

func (e ValidationErrors) Error() string {
	var a []string
	for _, v := range e {
		a = append(a, v.Field+": "+v.Message)
	}
	return strings.Join(a, "; ")
}

var versionPattern = regexp.MustCompile(`^(1\.[0-9]+(\.[0-9]+)?|[2-9][0-9]\.[0-9]+(\.[0-9]+)?)$`)
var usernamePattern = regexp.MustCompile(`^[A-Za-z0-9_]{1,16}$`)

func Validate(s Server) error {
	var es ValidationErrors
	add := func(f, m string) { es = append(es, FieldError{f, m}) }
	if s.APIVersion != APIVersion {
		add("apiVersion", "unsupported version")
	}
	if _, err := ulid.ParseStrict(s.ID); err != nil {
		add("id", "must be a ULID")
	}
	if strings.TrimSpace(s.Name) == "" || len(s.Name) > 64 || strings.ContainsAny(s.Name, "\n\r\x1b\t") {
		add("name", "use 1–64 printable characters")
	}
	switch s.Loader {
	case "VANILLA", "PAPER", "FABRIC":
	default:
		add("loader", "choose VANILLA, PAPER or FABRIC")
	}
	if !versionPattern.MatchString(s.Version) {
		add("version", "use a pinned release such as 1.21.1 or 26.1")
	}
	if s.Resources.HeapMiB < 512 {
		add("resources.heapMiB", "minimum is 512 MiB")
	}
	if s.Resources.MemoryMiB < s.Resources.HeapMiB+1024 {
		add("resources.memoryMiB", "allow at least 1024 MiB above the Java heap")
	}
	if math.IsNaN(s.Resources.CPUs) || math.IsInf(s.Resources.CPUs, 0) || s.Resources.CPUs < 0 || s.Resources.CPUs > 1024 {
		add("resources.cpus", "must be between 0 and 1024")
	}
	if s.Network.Port < 0 || s.Network.Port > 65535 {
		add("network.port", "must be 0 (automatic) or 1–65535")
	}
	switch s.Properties.Difficulty {
	case "peaceful", "easy", "normal", "hard":
	default:
		add("properties.difficulty", "choose peaceful, easy, normal or hard")
	}
	for _, n := range append(append([]string{}, s.Properties.Players...), s.Properties.Ops...) {
		if !usernamePattern.MatchString(n) {
			add("properties.players", "invalid Minecraft username: "+n)
		}
	}
	if strings.ContainsAny(s.Properties.MOTD, "\r\n\x1b") {
		add("properties.motd", "must fit on one line")
	}
	for _, m := range append(append([]Mod{}, s.Mods...), s.Plugins...) {
		if m.Project == "" || m.Version == "" {
			add("mods", "every mod/plugin needs a project and pinned version ID")
		}
	}
	switch s.Restart {
	case "no", "unless-stopped", "always", "on-failure":
	default:
		add("restart", "invalid restart policy")
	}
	if !s.EULA {
		add("eula", "accept https://aka.ms/MinecraftEULA before creating a server")
	}
	if len(es) > 0 {
		return es
	}
	return nil
}
func Hash(s Server) string {
	b, _ := json.Marshal(s)
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}
func Decode(b []byte) (Server, error) {
	var s Server
	err := json.Unmarshal(b, &s)
	if err != nil {
		return s, err
	}
	if s.APIVersion != APIVersion {
		return s, fmt.Errorf("unsupported spec version %q", s.APIVersion)
	}
	return s, nil
}
