<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { LayoutProps } from './$types';
	import SquareTerminal from '@lucide/svelte/icons/square-terminal';
	import * as Item from '$lib/components/ui/item/index.js';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortableItem from './_components/sortable-item.svelte';
	import type { DragEndEvent, DragOverEvent } from '@dnd-kit/abstract';
	import { Button } from '$lib/components/ui/button/index.js';
	import Play from '@lucide/svelte/icons/play';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import Square from '@lucide/svelte/icons/square';

	let { data }: LayoutProps = $props();

	let logs = $state<string[]>([]);

	let items = $state([1, 2, 3, 4]);
	let snapshot: number[] = [];

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
	<title>{data.activeMinecraftServer.name} - ContainerMC</title>
</svelte:head>
<div class="space-y-4">
	<InputGroup.Root>
		<InputGroup.Input placeholder="Enter command..." />
		<InputGroup.Addon>
			<SquareTerminal />
		</InputGroup.Addon>
	</InputGroup.Root>
	<Item.Root variant="outline">
		<Item.Header>
			<Item.Media class="row-span-2">
				<img src={data.activeMinecraftServer.iconUrl} alt="server icon" class="size-16" />
			</Item.Media>
			<Item.Title>{data.activeMinecraftServer.name}</Item.Title>
			<Item.Description>server motd goes here</Item.Description>
			<span>Player count</span>
		</Item.Header>
		<Item.Content></Item.Content>
		<Item.Footer>
			<ButtonGroup.Root>
				<Button>
					<Play />
					Start
				</Button>
				<Button>
					<Square />
					Stop
				</Button>
			</ButtonGroup.Root>
		</Item.Footer>
	</Item.Root>
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
