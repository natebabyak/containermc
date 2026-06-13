<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Sessions</h1>
<Item.Group>
	{#each data.activeMinecraftServer.sessions as session (session.id)}
		<Item.Root>
			<Item.Content>
				{session.costDollars}
			</Item.Content>
		</Item.Root>
	{/each}
</Item.Group>
