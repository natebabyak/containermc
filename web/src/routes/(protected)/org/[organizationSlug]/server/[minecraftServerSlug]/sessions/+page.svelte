<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { HARDWARE_OPTIONS, REGIONS } from '$lib/constants';
	import { formatCurrency, formatDuration, formatTime } from '$lib/formatters';
	import { computeSessionCost } from '$lib/helpers';
	import type { PageProps } from './$types';
	import Circle from '@lucide/svelte/icons/circle';

	let { data }: PageProps = $props();

	let numSessions = $derived(data.activeMinecraftServer.sessions.length);
</script>

<div class="space-y-4">
	<h1>Sessions</h1>
	<Item.Group>
		{#each data.activeMinecraftServer.sessions as session, index (session.id)}
			{@const isActive = !session.endedAt}
			<Item.Root size="xs" variant="outline">
				<Item.Content>
					<Item.Title>
						Session {numSessions - index}
						<Badge variant={isActive ? 'default' : 'secondary'}>
							{#if isActive}
								<Circle class="animate-ping" />
							{/if}
							{isActive ? 'Active' : 'Inactive'}
						</Badge>
					</Item.Title>
					<Item.Description>
						{REGIONS.find((r) => r.code === session.regionCode)?.name} &bull; {HARDWARE_OPTIONS.find(
							(o) => o.name === session.hardwareName
						)?.name}
					</Item.Description>
				</Item.Content>
				<Item.Content>
					<Item.Title>
						{#if isActive}
							{formatCurrency(
								computeSessionCost(session.hardwareName, session.startedAt, new Date())
							)}
						{:else}
							{formatCurrency(Number(session.costDollars))}
						{/if}
					</Item.Title>
					<Item.Description>
						{formatDuration(session.startedAt, session.endedAt)}
					</Item.Description>
				</Item.Content>
				<Item.Footer>
					<Item.Title>
						{#if isActive}
							Started at {formatTime(session.startedAt)}
						{:else}
							{formatTime(session.startedAt)} - {formatTime(session.endedAt!)}
						{/if}
					</Item.Title>
				</Item.Footer>
			</Item.Root>
		{/each}
	</Item.Group>
</div>
