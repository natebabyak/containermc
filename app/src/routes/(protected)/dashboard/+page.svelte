<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { PageProps } from './$types';
	import Server from '@lucide/svelte/icons/server';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import DashboardSidebar from './dashboard-sidebar.svelte';
	import CreateServerDialog from './create-server-dialog.svelte';

	let { data }: PageProps = $props();
</script>

<Sidebar.Provider>
	<DashboardSidebar />
	<main>
		{#if data.servers.length > 0}
			<ul>
				{#each data.servers as server, i (i)}
					<li>
						<Item.Root>
							<Item.Header>{server.name}</Item.Header>
							<Item.Media />
							<Item.Content>
								<Item.Title>Item</Item.Title>
								<Item.Description>Item</Item.Description>
							</Item.Content>
							<Item.Actions />
							<Item.Footer>Item Footer</Item.Footer>
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
						<CreateServerDialog paymentMethods={data.paymentMethods} regions={data.regions} />
						<Button variant="outline">Connect Server</Button>
					</div>
				</Empty.Content>
			</Empty.Root>
		{/if}
	</main>
</Sidebar.Provider>
