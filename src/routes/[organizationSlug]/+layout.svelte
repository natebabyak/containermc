<script lang="ts">
  import { Separator } from "#lib/components/ui/separator/index.ts";
  import * as Sidebar from "#lib/components/ui/sidebar/index.ts";

  import SidebarLeft from "./sidebar-left.svelte";
  import SidebarRight from "./sidebar-right.svelte";

  let { children } = $props();
</script>

<Sidebar.Provider>
  <SidebarLeft />
  <Sidebar.Inset>
    <header class="border-b p-1">
      <Sidebar.Trigger />
      <Separator orientation="vertical" />
    </header>
    {@render children()}
  </Sidebar.Inset>
  <SidebarRight />
</Sidebar.Provider>
