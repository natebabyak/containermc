<script lang="ts">
  import ArrowUpIcon from "phosphor-svelte/lib/ArrowUpIcon";

  import * as InputGroup from "#lib/components/ui/input-group/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import * as Sidebar from "#lib/components/ui/sidebar/index.ts";
</script>

<Sidebar.Root collapsible="none" class="sticky top-0 h-svh border-s">
  <Sidebar.Content></Sidebar.Content>
  <Sidebar.Footer>
    <InputGroup.Root>
      <InputGroup.Textarea placeholder="Ask anything..." />
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
