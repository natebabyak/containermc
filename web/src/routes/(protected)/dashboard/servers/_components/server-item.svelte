<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { Server } from '$lib/types';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import BoxIcon from '@lucide/svelte/icons/box';
	import { SERVER_TYPES } from '$lib/constants';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import { cn } from '$lib/utils';
	import SquareIcon from '@lucide/svelte/icons/square';
	import { scale } from 'svelte/transition';
	import PlayIcon from '@lucide/svelte/icons/play';

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
						<div transition:scale>
							<Spinner />
						</div>
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
			{#if server.status === 'running'}
				<Button size="xs" variant="outline">
					<SquareIcon />
					Stop
				</Button>
				<Button size="xs" variant="outline">
					<CopyIcon />
					Copy Address
				</Button>
			{:else if server.status === 'stopped'}
				<Button size="xs" variant="outline">
					<PlayIcon />
					Start
				</Button>
			{:else if server.status == 'error'}
				<Button size="xs" variant="outline">
					<RotateCcwIcon />
					Restart
				</Button>
			{/if}
		</Item.Actions>
	</Item.Footer>
</Item.Root>
