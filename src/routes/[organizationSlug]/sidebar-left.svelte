<script lang="ts">
  import { resolve } from "$app/paths";
  import CaretUpDownIcon from "phosphor-svelte/lib/CaretUpDownIcon";
  import ChartBarIcon from "phosphor-svelte/lib/ChartBarIcon";
  import FolderIcon from "phosphor-svelte/lib/FolderIcon";
  import GearIcon from "phosphor-svelte/lib/GearIcon";
  import UsersIcon from "phosphor-svelte/lib/UsersIcon";

  import { authClient } from "#lib/auth-client.ts";
  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.ts";
  import * as Sidebar from "#lib/components/ui/sidebar/index.ts";
  import { Skeleton } from "#lib/components/ui/skeleton/index.ts";

  const activeOrganization = authClient.useActiveOrganization();
  const organizations = authClient.useListOrganizations();
  const session = authClient.useSession();
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <div class="flex items-center justify-between gap-2">
          {#if $activeOrganization.isPending || !$activeOrganization.data}
            <Skeleton class="size-8 rounded-full" />
            <Skeleton />
          {:else}
            <a
              href={resolve("/[organizationSlug]", {
                organizationSlug: $activeOrganization.data.slug,
              })}
            >
              <Avatar.Root class="size-8">
                <Avatar.Image src={$activeOrganization.data?.logo} />
                <Avatar.Fallback />
              </Avatar.Root>
            </a>
          {/if}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuButton {...props} tooltipContent="Switch Organization" class="w-fit">
                  <CaretUpDownIcon />
                </Sidebar.MenuButton>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {#if $organizations.isPending}
                <Skeleton />
              {:else}
                {#each $organizations.data as organization}
                  <DropdownMenu.Item>
                    {organization.name}
                  </DropdownMenu.Item>
                {/each}
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent="Servers">Servers</Sidebar.MenuButton>
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
        <Sidebar.MenuButton>
          {#if $session.isPending}
            <Skeleton />
            <Skeleton />
          {:else}
            <Avatar.Root class="size-4">
              <Avatar.Image src={$session.data?.user.image} />
              <Avatar.Fallback>
                {$session.data?.user.name.charAt(0).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
            {$session.data?.user.name}
          {/if}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
