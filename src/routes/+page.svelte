<script lang="ts">
  import { resolve } from "$app/paths";

  import { authClient } from "#lib/auth-client.ts";
  import * as Avatar from "#lib/components/ui/avatar/index.ts";
  import { Button } from "#lib/components/ui/button/index.ts";

  const session = authClient.useSession();
</script>

<header class="flex items-center border-b p-4">
  <a href={resolve("/")}> ContainerMC </a>
  {#if $session.data}
    <Avatar.Root>
      <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
      <Avatar.Fallback>CN</Avatar.Fallback>
    </Avatar.Root>
  {:else}
    <div class="flex gap-2">
      <Button href={resolve("/sign-in")} variant="outline">Sign in</Button>
      <Button href={resolve("/sign-up")}>Sign up</Button>
    </div>
  {/if}
</header>
<h1>Deploy Minecraft servers locally or in the cloud in seconds</h1>
<footer></footer>
