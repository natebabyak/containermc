<script lang="ts">
  import { resolve } from "$app/paths";
  import MonitorIcon from "phosphor-svelte/lib/MonitorIcon";
  import MoonIcon from "phosphor-svelte/lib/MoonIcon";
  import SignOutIcon from "phosphor-svelte/lib/SignOutIcon";
  import SunIcon from "phosphor-svelte/lib/SunIcon";

  import { authClient } from "#lib/auth-client.ts";
  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.ts";

  const session = authClient.useSession();
</script>

<header class="flex items-center border-b p-4">
  <a href={resolve("/")}> ContainerMC </a>
  {#if $session.data}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Avatar.Root {...props}>
            <Avatar.Image src={$session.data?.user.image ?? undefined} alt="@shadcn" />
            <Avatar.Fallback>{$session.data?.user.name.charAt(0)}</Avatar.Fallback>
          </Avatar.Root>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>Theme</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent align="start">
              <DropdownMenu.CheckboxItem>
                <SunIcon />
                Light
              </DropdownMenu.CheckboxItem>
              <DropdownMenu.CheckboxItem>
                <MoonIcon />
                Dark
              </DropdownMenu.CheckboxItem>
              <DropdownMenu.CheckboxItem>
                <MonitorIcon />
                System
              </DropdownMenu.CheckboxItem>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
          <DropdownMenu.Item onclick={async () => await authClient.signOut()}>
            <SignOutIcon />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <div class="flex gap-2">
      <Button href={resolve("/sign-in")} variant="outline">Sign in</Button>
      <Button href={resolve("/sign-up")}>Sign up</Button>
    </div>
  {/if}
</header>
<h1>Deploy Minecraft servers locally or in the cloud in seconds</h1>
<footer></footer>
