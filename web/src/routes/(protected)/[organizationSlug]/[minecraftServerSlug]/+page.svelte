<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { PageProps } from './$types';
	import SquareTerminal from '@lucide/svelte/icons/square-terminal';
	import * as Item from '$lib/components/ui/item/index.js';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortableItem from './_components/sortable-item.svelte';
	let { data }: PageProps = $props();
	import type { DragOverEvent, DragEndEvent } from '@dnd-kit/abstract';
	import ServerItem from '$lib/components/server-item.svelte';

	let snapshot = $state<number[]>([]);

	let server = $derived(data.activeMinecraftServer);

	let logs = $state<string[]>([]);

	let items = $state([1, 2, 3, 4]);

	function onDragStart() {
		snapshot = items.slice();
	}

	function onDragOver(event: DragOverEvent) {
		items = move(items, event);
	}

	function onDragEnd(event: DragEndEvent) {
		if (event.canceled) items = snapshot;
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
		</Item.Content>
	</Item.Root>
	<DragDropProvider {onDragStart} {onDragOver} {onDragEnd}>
		<div class="grid-col-1 grid gap-4 lg:grid-cols-2">
			{#each items as id, index (id)}
				<SortableItem {id} {index} />
			{/each}
		</div>
	</DragDropProvider>
</div>
