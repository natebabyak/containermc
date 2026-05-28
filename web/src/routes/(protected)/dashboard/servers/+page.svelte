<script lang="ts">
	import type { PageProps } from './$types';
	import Server from '@lucide/svelte/icons/server';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import CreateServerDialog from './create-server-dialog.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Search from '@lucide/svelte/icons/search';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import ServerItem from './_components/server-item.svelte';

	let { data }: PageProps = $props();

	let inputRef = $state<HTMLInputElement | null>(null);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			inputRef?.focus();
		}
	}
</script>

<svelte:head>
	<title>Dashboard | ContainerMC</title>
	<meta name="description" content="" />
</svelte:head>
<svelte:window on:keydown={handleKeyDown} />
<div class="space-y-4 py-4">
	{#if data.servers.length > 0}
		<div class="flex justify-between px-4">
			<InputGroup.Root class="w-full max-w-xs">
				<InputGroup.Input bind:ref={inputRef} placeholder="Search servers..." />
				<InputGroup.Addon>
					<Search />
				</InputGroup.Addon>
				<InputGroup.Addon align="inline-end">
					<Kbd.Group>
						<Kbd.Root>⌘</Kbd.Root>
						<Kbd.Root>K</Kbd.Root>
					</Kbd.Group>
				</InputGroup.Addon>
			</InputGroup.Root>
			<CreateServerDialog regions={data.regions} />
		</div>
		<ul class="grid gap-4 px-4">
			{#each data.servers as server, i (i)}
				<li>
					<ServerItem {server} />
				</li>
			{/each}
		</ul>
	{:else}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<Server />
				</Empty.Media>
				<Empty.Title>No Servers</Empty.Title>
				<Empty.Description>
					You haven't created any servers yet. Get started by creating your first server.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<div class="flex gap-2">
					<CreateServerDialog regions={data.regions} />
					<Button variant="outline">Connect Server</Button>
				</div>
			</Empty.Content>
		</Empty.Root>
	{/if}
</div>
