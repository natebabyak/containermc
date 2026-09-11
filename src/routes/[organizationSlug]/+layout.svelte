<script lang="ts">
  import BellIcon from "phosphor-svelte/lib/BellIcon";
  import ChartBarIcon from "phosphor-svelte/lib/ChartBarIcon";
  import FolderIcon from "phosphor-svelte/lib/FolderIcon";
  import GearIcon from "phosphor-svelte/lib/GearIcon";
  import HouseIcon from "phosphor-svelte/lib/HouseIcon";
  import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import SlidersHorizontalIcon from "phosphor-svelte/lib/SlidersHorizontalIcon";
  import UsersIcon from "phosphor-svelte/lib/UsersIcon";

  import { Separator } from "#lib/components/ui/separator/index.ts";
  import * as Sidebar from "#lib/components/ui/sidebar/index.ts";

  let { children } = $props();
</script>

<Sidebar.Provider>
  <Sidebar.Root>
    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg" tooltipContent="ContainerMC">
            <span
              class="bg-sidebar-primary text-sidebar-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-none text-xs font-semibold"
            >
              CM
            </span>
            <span class="truncate font-semibold">ContainerMC</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>

    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive tooltipContent="Overview">
                <HouseIcon />
                <span>Overview</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent="Analytics">
                <ChartBarIcon />
                <span>Analytics</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent="Projects">
                <FolderIcon />
                <span>Projects</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Manage</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent="Team">
                <UsersIcon />
                <span>Team</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent="Settings">
                <GearIcon />
                <span>Settings</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent="Search">
            <MagnifyingGlassIcon />
            <span>Search</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Footer>
    <Sidebar.Rail />
  </Sidebar.Root>
  <Sidebar.Inset>
    <header
      class="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-3"
    >
      <Sidebar.Trigger />
      <Separator orientation="vertical" class="me-1 h-4" />
      <div class="flex min-w-0 flex-1 items-center">
        <span class="text-muted-foreground truncate text-xs font-medium">Dashboard</span>
      </div>
      <span class="text-muted-foreground ms-auto text-[10px] tracking-wider uppercase">Live</span>
    </header>
    <div class="flex min-h-0 flex-1 flex-col">
      {@render children()}
    </div>
  </Sidebar.Inset>
  <Sidebar.Root side="right" collapsible="none">
    <Sidebar.Header>
      <div class="flex items-center justify-between gap-2 px-2 py-1">
        <div class="flex min-w-0 items-center gap-2">
          <BellIcon />
          <span class="truncate text-xs font-semibold">Activity</span>
        </div>
        <span class="bg-primary text-primary-foreground rounded-none px-1.5 py-0.5 text-[10px]"
          >3</span
        >
      </div>
    </Sidebar.Header>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Quick filters</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive>
                <SlidersHorizontalIcon />
                <span>All activity</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                <span class="bg-primary size-2 rounded-full" aria-hidden="true"></span>
                <span>Deployments</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                <span class="bg-muted-foreground size-2 rounded-full" aria-hidden="true"></span>
                <span>Team updates</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Recent</Sidebar.GroupLabel>
        <Sidebar.GroupContent class="px-2">
          <div class="flex flex-col gap-4 text-xs">
            <div class="flex flex-col gap-1">
              <span class="font-medium">Production deploy succeeded</span>
              <span class="text-muted-foreground">2 minutes ago</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="font-medium">New team member added</span>
              <span class="text-muted-foreground">18 minutes ago</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="font-medium">API limits updated</span>
              <span class="text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Rail />
  </Sidebar.Root>
</Sidebar.Provider>
