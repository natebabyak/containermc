<script lang="ts">
	import type { PageProps } from './$types';
	import Server from '@lucide/svelte/icons/server';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import CreateServerDialog from './create-server-dialog.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Search from '@lucide/svelte/icons/search';
	import { resolve } from '$app/paths';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Box from '@lucide/svelte/icons/box';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import Copy from '@lucide/svelte/icons/copy';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

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
					<Item.Root variant="outline">
						<Item.Media variant="image">
							<Avatar.Root>
								<Avatar.Image src={server.iconUrl ?? undefined} />
								<Avatar.Fallback>
									<Box />
								</Avatar.Fallback>
							</Avatar.Root>
						</Item.Media>
						<Item.Content>
							<Item.Title>
								{server.name}
								<Badge class="capitalize">
									<Spinner />
									{server.status}
								</Badge>
							</Item.Title>
							{@const ipAddress = `${server.slug}.containermc.com`}
							<Button
								onclick={() => navigator.clipboard.writeText(ipAddress)}
								size="xs"
								variant="ghost"
							>
								{ipAddress}
								<Copy />
							</Button>
						</Item.Content>
						<Item.Actions>
							<Button
								href={resolve(`/dashboard/servers/${server.slug}`)}
								size="sm"
								variant="outline"
							>
								Manage
								<ExternalLink />
							</Button>
						</Item.Actions>
						<Item.Footer class="justify-start gap-8">
							<div>
								<Item.Title>Players</Item.Title>
								<Item.Description>10/50</Item.Description>
							</div>
							<div>
								<Item.Title>Session Uptime</Item.Title>
								<Item.Description>2h 14m</Item.Description>
							</div>
							<div>
								<Item.Title>Session Cost</Item.Title>
								<Item.Description>$0.03</Item.Description>
							</div>
						</Item.Footer>
					</Item.Root>
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
