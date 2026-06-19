<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { PageProps } from './$types';
	import SquareTerminal from '@lucide/svelte/icons/square-terminal';
	import * as Item from '$lib/components/ui/item/index.js';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortableItem from './_components/sortable-item.svelte';
	import type { DragEndEvent, DragOverEvent } from '@dnd-kit/abstract';
	import ServerItem from '$lib/components/server-item.svelte';

	let { data }: PageProps = $props();

	let server = $derived(data.activeMinecraftServer);

	let logs = $state<string[]>([]);

	const chartPanels = [
		{
			id: 'billing',
			title: 'Session cost',
			seriesKey: 'cost' as const,
			seriesLabel: 'Cost',
			color: 'var(--chart-1)'
		},
		{
			id: 'players',
			title: 'Players',
			seriesKey: 'players' as const,
			seriesLabel: 'Players',
			color: 'var(--chart-2)'
		},
		{
			id: 'cpu',
			title: 'CPU',
			seriesKey: 'cpu' as const,
			seriesLabel: 'CPU %',
			color: 'var(--chart-3)'
		},
		{
			id: 'memory',
			title: 'Memory',
			seriesKey: 'memory' as const,
			seriesLabel: 'Memory %',
			color: 'var(--chart-4)'
		},
		{
			id: 'tps',
			title: 'TPS',
			seriesKey: 'tps' as const,
			seriesLabel: 'TPS',
			color: 'var(--chart-5)'
		}
	];

	let panelOrder = $state(chartPanels.map((panel) => panel.id));
	let snapshot = $state<string[]>([]);

	function onDragStart() {
		snapshot = panelOrder.slice();
	}

	function onDragOver(event: DragOverEvent) {
		panelOrder = move(panelOrder, event);
	}

	function onDragEnd(event: DragEndEvent) {
		if (event.canceled) panelOrder = snapshot;
	}
</script>

<svelte:head>
	<title>{server.name} - ContainerMC</title>
</svelte:head>
<div class="space-y-4">
	<InputGroup.Root>
		<InputGroup.Input placeholder="Enter command..." />
		<InputGroup.Addon>
			<SquareTerminal />
		</InputGroup.Addon>
	</InputGroup.Root>
	<ServerItem {server} />
	<Item.Root variant="outline">
		<Item.Header>
			<Item.Title>Logs</Item.Title>
		</Item.Header>
		<Item.Content>
			{#each logs as log, i (i)}
				<pre>{log}</pre>
			{/each}
			{#if logs.length === 0}
				<p class="text-muted-foreground text-sm">Server logs coming soon.</p>
			{/if}
		</Item.Content>
	</Item.Root>
	<DragDropProvider {onDragStart} {onDragOver} {onDragEnd}>
		<div class="grid-col-1 grid gap-4 lg:grid-cols-2">
			{#each panelOrder as panelId, index (panelId)}
				{@const panel = chartPanels.find((entry) => entry.id === panelId)!}
				<SortableItem
					id={panel.id}
					{index}
					title={panel.title}
					seriesKey={panel.seriesKey}
					seriesLabel={panel.seriesLabel}
					color={panel.color}
					data={data.chartData}
				/>
			{/each}
		</div>
	</DragDropProvider>
</div>
