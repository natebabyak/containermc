<script lang="ts">
  import { resolve } from "$app/paths";
  import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";

  import Header from "#lib/components/header.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
</script>

<Header />
<main>
  <h1 class="text-center font-serif text-4xl tracking-tighter text-balance">
    Deploy Minecraft servers anywhere in minutes
  </h1>
  <p></p>
  <div>
    <Button href={resolve("/sign-up")} size="lg">
      Get Started
      <ArrowRightIcon />
    </Button>
    <Button href={resolve("/pricing")} variant="outline" size="lg">Pricing</Button>
  </div>
</main>
