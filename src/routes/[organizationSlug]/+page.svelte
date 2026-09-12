<script lang="ts">
  import { resolve } from "$app/paths";

  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Empty from "#lib/components/ui/empty/index.ts";

  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<main class="space-y-4 p-4">
  <h1>{data.organization.name}</h1>
  {#each data.servers as server}
    <Card.Root></Card.Root>
  {:else}
    <Empty.Root class="border">
      <Empty.Header>
        <Empty.Title>Welcome to ContainerMC</Empty.Title>
        <Empty.Description>Create your first server to get started.</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button
          href={resolve("/[organizationSlug]/new", {
            organizationSlug: data.organization.slug,
          })}
        >
          Create Server
        </Button>
      </Empty.Content>
    </Empty.Root>
  {/each}
</main>
