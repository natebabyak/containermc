<script lang="ts">
	import type { PageProps } from './$types';
	import Server from '@lucide/svelte/icons/server';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import CreateServerDialog from './create-server-dialog.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import Search from '@lucide/svelte/icons/search';
	import Play from '@lucide/svelte/icons/play';
	import Square from '@lucide/svelte/icons/square';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Dashboard | ContainerMC</title>
	<meta name="description" content="" />
</svelte:head>
<div class="space-y-4 py-4">
	<div class="flex justify-between px-4">
		<InputGroup.Root>
			<InputGroup.Input placeholder="Search server..." />
			<InputGroup.Addon>
				<Search />
			</InputGroup.Addon>
		</InputGroup.Root>
		<CreateServerDialog regions={data.regions} />
	</div>
	{#if data.servers.length > 0}
		<ul class="grid gap-4 px-4">
			{#each data.servers as server, i (i)}
				<li>
					<Item.Root variant="outline">
						{#snippet child({ props })}
							<a {...props} href={resolve(`/dashboard/servers/${server.slug}`)}>
								<Item.Content>
									<Item.Title>{server.name}</Item.Title>
									<Item.Description>{server.slug}.containermc.com</Item.Description>
								</Item.Content>
								<Item.Media />
								<Item.Actions>
									<ButtonGroup.Root>
										<Button size="icon-sm" variant="outline">
											<Play />
										</Button>
										<Button size="icon-sm" variant="outline">
											<Square />
										</Button>
									</ButtonGroup.Root>
								</Item.Actions>
							</a>
						{/snippet}
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
