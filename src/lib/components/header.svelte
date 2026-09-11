<script lang="ts">
  import { resolve } from "$app/paths";
  import ArrowUpRightIcon from "phosphor-svelte/lib/ArrowUpRightIcon";

  import { authClient } from "#lib/auth-client.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as NavigationMenu from "#lib/components/ui/navigation-menu/index.ts";
  import { navigationMenuTriggerStyle } from "#lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";

  const session = authClient.useSession();
</script>

<header class="flex items-center justify-between border-b p-4">
  <a href={resolve("/")}>ContainerMC</a>
  <NavigationMenu.Root>
    <NavigationMenu.List>
      <NavigationMenu.Item>
        <NavigationMenu.Trigger>Item One</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <NavigationMenu.Link>Link</NavigationMenu.Link>
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link>
          {#snippet child()}
            <a href={resolve("/pricing")} class={navigationMenuTriggerStyle()}>Pricing</a>
          {/snippet}
        </NavigationMenu.Link>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  </NavigationMenu.Root>
  {#if $session.data}
    <Button href={resolve("/dashboard")}
      >Dashboard
      <ArrowUpRightIcon />
    </Button>
  {:else}
    <div class="flex gap-2">
      <Button href={resolve("/sign-in")} variant="outline">Sign in</Button>
      <Button href={resolve("/sign-up")}>Sign up</Button>
    </div>
  {/if}
</header>
