<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { HARDWARE_OPTIONS, REGIONS } from '$lib/constants';
	import { formatBalance, formatDuration, formatTime } from '$lib/formatters';
	import { computeSessionCost } from '$lib/helpers';
	import type { MinecraftServerSessionSelect } from '$lib/types';
	import Circle from '@lucide/svelte/icons/circle';

	interface Props {
		session: MinecraftServerSessionSelect;
		number: number;
	}

	let { session, number }: Props = $props();

	const isActive = $derived(!session.endedAt);
</script>

<Item.Root size="xs" variant="outline">
	<Item.Content>
		<Item.Title>
			Session {number}
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
	<Item.Content class="*:ml-auto">
		<Item.Title>
			{#if isActive}
				{formatBalance(computeSessionCost(session.hardwareName, session.startedAt, new Date()))}
			{:else}
				{formatBalance(Number(session.costDollars))}
			{/if}
		</Item.Title>
		<Item.Description>
			{#if session.endedAt}
				{formatDuration(session.startedAt, session.endedAt)}
			{:else}
				Started at {formatTime(session.startedAt)}
			{/if}
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
