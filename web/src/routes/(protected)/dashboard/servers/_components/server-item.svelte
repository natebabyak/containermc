<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { Server } from '$lib/types';
	import Copy from '@lucide/svelte/icons/copy';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Box from '@lucide/svelte/icons/box';

	interface Props {
		server: Server;
	}

	let { server }: Props = $props();
</script>

<Item.Root variant="outline">
	<Item.Media variant={server.iconUrl ? 'image' : 'icon'}>
		{#if server.iconUrl}
			<img src={server.iconUrl} alt="Server Icon" />
		{:else}
			<Box />
		{/if}
	</Item.Media>
	<Item.Content>
		<Item.Title>
			{server.name}
			<Badge class="capitalize">
				{#if server.status in ['starting', 'pending', 'stopping']}
					<Spinner />
				{/if}
				{server.status}
			</Badge>
		</Item.Title>
		{@const ipAddress = `${server.slug}.containermc.com`}
		<Button onclick={() => navigator.clipboard.writeText(ipAddress)} size="xs" variant="ghost">
			{ipAddress}
			<Copy />
		</Button>
	</Item.Content>
	<Item.Actions>
		<Button href={resolve(`/dashboard/servers/${server.slug}`)} size="sm" variant="outline">
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
