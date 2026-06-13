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
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Trash from '@lucide/svelte/icons/trash';

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
<div class="space-y-4 p-4">
	<InputGroup.Root>
		<InputGroup.Input placeholder="Enter command..." />
		<InputGroup.Addon>
			<SquareTerminal />
		</InputGroup.Addon>
	</InputGroup.Root>
	<DragDropProvider {onDragEnd}>
		<Item.Root>
			<Item.Header>
				<Item.Media class="row-span-2">
					<img src={data.activeMinecraftServer.iconUrl} alt="server icon" class="size-16" />
				</Item.Media>
				<Item.Title>{data.activeMinecraftServer.name}</Item.Title>
				<Item.Description>server motd goes here</Item.Description>
				<span>Player count</span>
			</Item.Header>
			<Item.Content>
				<Button>
					<Play />
					Start
				</Button>
			</Item.Content>
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
			{#each items as id, index (id)}
				<SortableItem {id} {index} />
			{/each}
		</DragDropProvider>
	</DragDropProvider>
	<Separator />
	<h2>Danger Zone</h2>
	<section class="rounded-2xl border p-8">
		<Button variant="destructive">
			<Trash />
			Delete "{data.activeMinecraftServer.name}"
		</Button>
	</section>
</div>
