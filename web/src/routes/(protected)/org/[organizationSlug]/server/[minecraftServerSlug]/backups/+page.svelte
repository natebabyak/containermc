<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Backups</h1>
<Item.Group>
	{#each data.activeMinecraftServer.backups as backup (backup.id)}
		<Item.Root>
			<Item.Content>
				{backup.minecraftServerId}
			</Item.Content>
		</Item.Root>
	{/each}
</Item.Group>
