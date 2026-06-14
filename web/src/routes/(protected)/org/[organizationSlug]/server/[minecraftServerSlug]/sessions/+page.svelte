<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { formatCurrency, formatDuration, formatTime } from '$lib/formatters';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{data.activeMinecraftServer.name} Sessions</h1>
<Item.Group>
	{#each data.activeMinecraftServer.sessions as session, index (session.id)}
		<Item.Root size="xs" variant="outline">
			<Item.Content>
				<Item.Title>
					Session {index + 1}
					<Badge variant={session.endedAt ? 'secondary' : 'default'}>
						{session.endedAt ? 'Inactive' : 'Active'}
					</Badge>
				</Item.Title>
				<Item.Description>
					{formatTime(session.startedAt)} - {formatTime(session.endedAt)}
				</Item.Description>
			</Item.Content>
			<Item.Content>
				<Item.Title>
					{formatCurrency(Number(session.costDollars))}
				</Item.Title>
				<Item.Description>
					{formatDuration(session.startedAt, session.endedAt)}
				</Item.Description>
			</Item.Content>
		</Item.Root>
	{/each}
</Item.Group>
