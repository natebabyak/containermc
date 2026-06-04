<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { Server } from '$lib/types';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import BoxIcon from '@lucide/svelte/icons/box';
	import { SERVER_TYPES } from '$lib/constants';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import { cn } from '$lib/utils';
	import SquareIcon from '@lucide/svelte/icons/square';
	import PlayIcon from '@lucide/svelte/icons/play';
	import DeleteServerDialog from './delete-server-dialog.svelte';
	import CopyAddressButton from './copy-address-button.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		server: Server;
	}

	let { server }: Props = $props();
</script>

<Item.Root variant="outline">
	<Item.Header class="justify-start">
		<Item.Media variant="image">
			{#if server.iconUrl}
				<img src={server.iconUrl} alt="Server Icon" />
			{:else}
				<BoxIcon />
			{/if}
		</Item.Media>
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2">
				<Item.Title>
					{server.name}
				</Item.Title>
				<Badge
					variant={server.status === 'running'
						? 'default'
						: server.status === 'error'
							? 'destructive'
							: 'secondary'}
					class={cn(
						'capitalize',
						server.status.endsWith('ing') && 'dark:bg:amber-600 bg-amber-500 text-white'
					)}
				>
					{#if server.status.endsWith('ing')}
						<Spinner />
					{/if}
					{server.status}
				</Badge>
			</div>
			<Item.Description>
				<span class="capitalize">
					{server.minecraftVersion.toLowerCase()}
				</span>
				&bull;
				{SERVER_TYPES.find((t) => t.value === server.type)?.label}
			</Item.Description>
		</div>
		<Item.Actions class="ml-auto">
			<Button href={resolve(`/dashboard/servers/${server.slug}`)} size="xs" variant="outline">
				Manage
				<ExternalLink />
			</Button>
		</Item.Actions>
	</Item.Header>
	<Item.Footer>
		<Item.Actions>
			{#if server.status === 'stopped'}
				<form
					method="POST"
					action="?/startServer"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							await invalidateAll();
						};
					}}
				>
					<input type="hidden" name="serverId" value={server.id} />
					<Button size="xs" type="submit" variant="outline">
						<PlayIcon />
						Start
					</Button>
				</form>
			{:else if server.status === 'error'}
				<Button size="xs" variant="outline">
					<RotateCcwIcon />
					Restart
				</Button>
			{:else}
				<form
					method="POST"
					action="?/stopServer"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							await invalidateAll();
						};
					}}
				>
					<input type="hidden" name="serverId" value={server.id} />
					<Button disabled={server.status !== 'running'} size="xs" type="submit" variant="outline">
						<SquareIcon />
						Stop
					</Button>
				</form>
			{/if}
			<CopyAddressButton address={`${server.slug}.containermc.com`} />
			<DeleteServerDialog {server} />
		</Item.Actions>
	</Item.Footer>
</Item.Root>
