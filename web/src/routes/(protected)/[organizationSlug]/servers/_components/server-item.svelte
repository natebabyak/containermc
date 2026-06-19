<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import BoxIcon from '@lucide/svelte/icons/box';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import { cn } from '$lib/utils';
	import SquareIcon from '@lucide/svelte/icons/square';
	import PlayIcon from '@lucide/svelte/icons/play';
	import CopyAddressButton from './copy-address-button.svelte';
	import { enhance } from '$app/forms';
	import { REGIONS } from '$lib/constants';
	import { onDestroy, onMount } from 'svelte';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { page } from '$app/state';
	import type { MinecraftServerSelect } from '$lib/types';

	interface Props {
		server: MinecraftServerSelect;
	}

	let { server }: Props = $props();

	let currentStatus = $derived<MinecraftServerSelect['status']>(server.status);
	let pollInterval: NodeJS.Timeout | null = null;

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	function startPolling() {
		if (pollInterval) return;

		pollInterval = setInterval(async () => {
			const url = `/api/minecraft-server/${server.id}/status`;
			try {
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error('Minecraft server status fetch failed');
				}

				const data = await response.json();
				currentStatus = data.status;

				if (
					currentStatus === 'running' ||
					currentStatus === 'stopped' ||
					currentStatus === 'error'
				) {
					stopPolling();
				}
			} catch (err) {
				console.error((err as Error).message);
			}
		}, 3000);
	}

	onMount(() => {
		if (currentStatus === 'starting' || currentStatus === 'stopping') {
			startPolling();
		}
	});

	onDestroy(() => {
		stopPolling();
	});
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
					variant={currentStatus === 'running'
						? 'default'
						: currentStatus === 'error'
							? 'destructive'
							: 'secondary'}
					class={cn(
						'capitalize',
						(currentStatus === 'starting' || currentStatus === 'stopping') &&
							'dark:bg:amber-600 bg-amber-500 text-white'
					)}
				>
					{#if currentStatus === 'starting' || currentStatus === 'stopping'}
						<Spinner />
					{:else if currentStatus === 'error'}
						<TriangleAlert />
					{/if}
					{currentStatus}
				</Badge>
			</div>
			<Item.Description>
				{REGIONS.find((r) => r.code === server.regionCode)?.name}
				&bull;
				{server.hardwareName}
			</Item.Description>
		</div>
		<Item.Actions class="ml-auto">
			<Button
				href={resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]', {
					organizationSlug: page.params.organizationSlug!,
					minecraftServerSlug: server.slug
				})}
				size="xs"
				variant="outline"
			>
				Manage
				<ExternalLink />
			</Button>
		</Item.Actions>
	</Item.Header>
	<Item.Footer>
		<Item.Actions>
			{#if currentStatus === 'stopped'}
				<form
					method="POST"
					action="?/startMinecraftServer"
					use:enhance={() => {
						currentStatus = 'starting';
						startPolling();
					}}
				>
					<input type="hidden" name="minecraftServerId" value={server.id} />
					<Button size="xs" type="submit" variant="outline">
						<PlayIcon />
						Start
					</Button>
				</form>
			{:else if currentStatus === 'error'}
				<form
					method="POST"
					action="?/startMinecraftServer"
					use:enhance={() => {
						currentStatus = 'starting';
						startPolling();
					}}
				>
					<input type="hidden" name="minecraftServerId" value={server.id} />
					<Button size="xs" type="submit" variant="outline">
						<RotateCcwIcon />
						Restart
					</Button>
				</form>
			{:else if server}
				<form
					method="POST"
					action="?/stopMinecraftServer"
					use:enhance={() => {
						currentStatus = 'stopping';
						startPolling();
					}}
				>
					<input type="hidden" name="minecraftServerId" value={server.id} />
					<Button disabled={currentStatus === 'stopping'} size="xs" type="submit" variant="outline">
						<SquareIcon />
						Stop
					</Button>
				</form>
			{/if}
			<CopyAddressButton address={`${server.slug}.mc.containermc.com`} />
		</Item.Actions>
	</Item.Footer>
</Item.Root>
