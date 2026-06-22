<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, tick } from 'svelte';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	type LogSource = 'server' | 'ec2';

	interface Props {
		serverId: string;
		disabled?: boolean;
	}

	let { serverId, disabled = false }: Props = $props();

	let source = $state<LogSource>('server');
	let lines = $state<string[]>([]);
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let scrollElement = $state<HTMLElement | null>(null);
	let pinnedToBottom = $state(true);

	let pollInterval: ReturnType<typeof setInterval> | null = null;

	const BOTTOM_THRESHOLD = 40;
	const LINE_HEIGHT = 20;

	const virtualizer = createVirtualizer({
		count: 0,
		getScrollElement: () => scrollElement,
		estimateSize: () => LINE_HEIGHT,
		overscan: 10
	});

	function isNearBottom(element: HTMLElement): boolean {
		return (
			element.scrollHeight - element.scrollTop - element.clientHeight <= BOTTOM_THRESHOLD
		);
	}

	function scrollToBottom() {
		if (!scrollElement || lines.length === 0) return;
		scrollElement.scrollTop = scrollElement.scrollHeight;
		$virtualizer.scrollToIndex(lines.length - 1, { align: 'end' });
		pinnedToBottom = true;
	}

	function onScroll() {
		if (!scrollElement) return;
		pinnedToBottom = isNearBottom(scrollElement);
	}

	async function scrollToBottomIfPinned() {
		if (!pinnedToBottom || !scrollElement || lines.length === 0) return;
		await tick();
		scrollToBottom();
	}

	async function fetchLogs() {
		if (disabled) return;

		loading = true;
		errorMessage = null;

		try {
			const response = await fetch(
				`/api/minecraft-server/${serverId}/logs?source=${source}`
			);
			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				errorMessage = payload.message ?? 'Failed to load logs';
				return;
			}

			lines = payload.lines ?? [];
		} catch {
			errorMessage = 'Failed to load logs';
		} finally {
			loading = false;
			await scrollToBottomIfPinned();
		}
	}

	function startPolling() {
		stopPolling();
		if (disabled) return;

		void fetchLogs();
		pollInterval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				void fetchLogs();
			}
		}, 5000);
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	onDestroy(() => {
		stopPolling();
	});

	$effect(() => {
		if (disabled) {
			stopPolling();
			lines = [];
			return;
		}

		source;
		pinnedToBottom = true;
		startPolling();
	});

	$effect(() => {
		const count = lines.length;
		const element = scrollElement;
		if (!browser || !element) return;

		$virtualizer.setOptions({
			count,
			getScrollElement: () => element
		});
	});

	$effect(() => {
		lines.length;
		void scrollToBottomIfPinned();
	});
</script>

<Item.Root variant="outline" class="min-w-0 w-full max-w-full">
	<Item.Header class="flex flex-row items-center justify-between gap-4">
		<div class="min-w-0">
			<Item.Title>Logs</Item.Title>
			<Item.Description>
				{source === 'server' ? 'Minecraft server output' : 'EC2 bootstrap logs'}
			</Item.Description>
		</div>
		<Tabs.Root bind:value={source}>
			<Tabs.List>
				<Tabs.Trigger value="server" disabled={disabled}>Server</Tabs.Trigger>
				<Tabs.Trigger value="ec2" disabled={disabled}>EC2</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</Item.Header>
	<Item.Content class="min-w-0">
		{#if disabled}
			<p class="text-muted-foreground text-sm">Start the server to view logs.</p>
		{:else}
			<div class="relative">
				<div
					bind:this={scrollElement}
					class="h-80 w-full overflow-auto rounded-md border bg-muted/30 font-mono text-xs"
					onscroll={onScroll}
				>
					{#if loading && lines.length === 0}
						<div class="flex items-center gap-2 p-3 text-sm text-muted-foreground">
							<Spinner />
							Loading logs...
						</div>
					{:else if errorMessage}
						<p class="text-destructive p-3 text-sm">{errorMessage}</p>
					{:else if lines.length === 0}
						<p class="text-muted-foreground p-3 text-sm">No logs yet.</p>
					{:else}
						<div
							class="relative w-max min-w-full"
							style="height: {$virtualizer.getTotalSize()}px;"
						>
							{#each $virtualizer.getVirtualItems() as row (row.index)}
								<div
									class="absolute top-0 left-0 w-max min-w-full px-3 leading-5 whitespace-pre"
									style="height: {row.size}px; transform: translateY({row.start}px);"
								>
									{lines[row.index]}
								</div>
							{/each}
						</div>
					{/if}
				</div>
				{#if !pinnedToBottom && lines.length > 0}
					<Button
						size="sm"
						variant="secondary"
						class="absolute right-3 bottom-3 shadow-md"
						onclick={scrollToBottom}
					>
						<ChevronDown />
						Scroll to bottom
					</Button>
				{/if}
			</div>
		{/if}
	</Item.Content>
</Item.Root>
