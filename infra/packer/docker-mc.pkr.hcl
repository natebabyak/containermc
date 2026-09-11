packer {
  required_plugins {
    docker = {
      version = ">= 1.0.8",
      source = "github.com/hashicorp/docker"
    }
  }
}

source "docker" "mc" {
  image = "itzg/minecraft-server:latest"
  commit = true
}

build {
  name  "b"
  sources = [
    "source.docker.mc"
  ]
}
