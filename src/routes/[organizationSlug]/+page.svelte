<script>
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Empty from "#lib/components/ui/empty/index.ts";
</script>

{#each [] as server}
  <Card.Root></Card.Root>
{:else}
  <Empty.Root>
    <Empty.Header>
      <Empty.Title>Welcome to ContainerMC</Empty.Title>
      <Empty.Description>Create your first server to get started.</Empty.Description>
    </Empty.Header>
    <Empty.Content>
      <Button>Create Server</Button>
    </Empty.Content>
  </Empty.Root>
{/each}
