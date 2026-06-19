<script lang="ts">
	import type { PageProps } from './$types';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Search from '@lucide/svelte/icons/search';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import ServerItem from './_components/server-item.svelte';
	import Containermc from '$lib/components/icons/containermc.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { resolve } from '$app/paths';
	import PlusCircle from '@lucide/svelte/icons/plus-circle';

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

{#if data.minecraftServers.length > 0}
	<div class="flex flex-col gap-4 px-4">
		<div class="flex justify-between">
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
			<Button
				href={resolve('/(protected)/[organizationSlug]/servers/new', {
					organizationSlug: data.activeOrganization.slug
				})}
			>
				<PlusCircle />
				Create Server
			</Button>
		</div>
		<Item.Group>
			{#each data.minecraftServers as server (server.id)}
				<ServerItem {server} />
			{/each}
		</Item.Group>
	</div>
{:else}
	<div class="size-full items-center justify-center">
		<Empty.Root>
			<Empty.Header>
				<Empty.Media>
					<Containermc class="size-8" />
				</Empty.Media>
				<Empty.Title>Welcome to ContainerMC</Empty.Title>
				<Empty.Description>
					You haven't created any servers yet. Get started by creating your first server.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button
					href={resolve('/(protected)/[organizationSlug]/servers/new', {
						organizationSlug: data.activeOrganization.slug
					})}
				>
					<PlusCircle />
					Create Server
				</Button>
			</Empty.Content>
		</Empty.Root>
	</div>
{/if}
