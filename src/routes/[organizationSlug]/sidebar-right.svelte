<script lang="ts">
  import { resolve } from "$app/paths";
  import ArrowUpIcon from "phosphor-svelte/lib/ArrowUpIcon";
  import ArrowUpRightIcon from "phosphor-svelte/lib/ArrowUpRightIcon";

  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Empty from "#lib/components/ui/empty/index.ts";
  import * as InputGroup from "#lib/components/ui/input-group/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import * as Sidebar from "#lib/components/ui/sidebar/index.ts";
</script>

<Sidebar.Root collapsible="none" class="sticky top-0 hidden h-svh border-s">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>Close sidebar</Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <Empty.Root>
      <Empty.Header>
        <Empty.Title>Obi</Empty.Title>
        <Empty.Description>placeholder</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button href={resolve("/pricing")}>
          Upgrade to Pro
          <ArrowUpRightIcon />
        </Button>
      </Empty.Content>
    </Empty.Root>
  </Sidebar.Content>
  <Sidebar.Footer>
    <InputGroup.Root>
      <InputGroup.Textarea disabled placeholder="Ask anything..." />
      <InputGroup.Addon align="block-end">
        <NativeSelect.Root>
          <NativeSelect.Option>Agent</NativeSelect.Option>
        </NativeSelect.Root>
        <InputGroup.Button variant="default" size="icon-sm" class="ml-auto">
          <ArrowUpIcon />
        </InputGroup.Button>
      </InputGroup.Addon>
    </InputGroup.Root>
  </Sidebar.Footer>
</Sidebar.Root>
