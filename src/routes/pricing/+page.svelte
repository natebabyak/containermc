<script lang="ts">
  import Header from "#lib/components/header.svelte";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
</script>

<Header />
<main class="space-y-8 p-8">
  <h1 class="text-center font-serif text-3xl tracking-tighter">
    Pay only for what you use, by the second
  </h1>
  <p class="text-muted-foreground text-center text-sm text-balance">
    Don't pay while your server isn't running.
  </p>
  <ul class="grid grid-cols-3 gap-4 p-4">
    <li>
      <Card.Root>
        <Card.Header>
          <Card.Title>Free</Card.Title>
          <Card.Description></Card.Description>
        </Card.Header>
        <Card.Content>
          <Button>Get Started</Button>
        </Card.Content>
        <Card.Footer></Card.Footer>
      </Card.Root>
    </li>
    <li>
      <Card.Root>
        <Card.Header>
          <Card.Title>Pro</Card.Title>
          <Card.Description></Card.Description>
        </Card.Header>
        <Card.Content>
          <span>$5/month</span>
          <Button>Upgrade to Pro</Button>
        </Card.Content>
        <Card.Footer>
          <p>Everything in free, plus:</p>
          <ul>
            <li>$5 monthly credit</li>
            <li>Custom domains</li>
          </ul>
        </Card.Footer>
      </Card.Root>
    </li>
    <li>
      <Card.Root>
        <Card.Header>
          <Card.Title>Team</Card.Title>
          <Card.Description></Card.Description>
        </Card.Header>
        <Card.Content>
          <Button></Button>
        </Card.Content>
      </Card.Root>
    </li>
  </ul>
  <ul>
    <li></li>
  </ul>
</main>
