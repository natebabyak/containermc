<script lang="ts">
  import "./layout.css";
  import { ModeWatcher } from "mode-watcher";

  import favicon from "#lib/assets/favicon.svg";
  import * as Tooltip from "#lib/components/ui/tooltip/index.ts";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
