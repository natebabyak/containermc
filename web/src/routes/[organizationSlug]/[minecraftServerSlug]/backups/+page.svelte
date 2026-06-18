<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { formatTime } from '$lib/formatters';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Backups</h1>
<Item.Group>
	{#each data.activeMinecraftServer.backups as backup (backup.id)}
		<Item.Root variant="outline">
			<Item.Content>
				<Item.Title>
					{data.activeMinecraftServer.name} at {formatTime(backup.createdAt)}
				</Item.Title>
				<Item.Description>
					{new Intl.NumberFormat('en-US', {
						style: 'unit',
						unit: 'byte',
						unitDisplay: 'long'
					}).format(backup.sizeBytes)}
				</Item.Description>
			</Item.Content>
			<Item.Actions>
				<Button class="border-primary bg-linear-to-b from-white/20 via-primary to-black/20">
					Restore
				</Button>
			</Item.Actions>
		</Item.Root>
	{/each}
</Item.Group>
