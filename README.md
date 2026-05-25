# ContainerMC

The easiest way to deploy a Minecraft server in the cloud.

> [!WARNING]
> ContainerMC is still in early development

## Quick Start

- ContainerMC: [https://containermc.com](https://containermc.com)
- Self-hosting guide

## Getting Started

### Prerequisites

- bun
- Docker

### Installation

#### 1. Clone the repository

```sh
git clone https://github.com/natebabyak/containermc.git
```

#### 2. Set the working directory

```sh
cd containermc/app
```

#### 3. Install dependencies

```sh
bun install
```

#### 4. Start the development database

```sh
docker compose up -d
```

#### 5. Start the development server

```sh
bun --bun run dev
```
