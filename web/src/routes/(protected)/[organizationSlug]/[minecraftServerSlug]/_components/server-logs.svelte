<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

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
	let logContainer: HTMLPreElement | undefined = $state();

	let pollInterval: ReturnType<typeof setInterval> | null = null;

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
			queueMicrotask(() => {
				if (logContainer) {
					logContainer.scrollTop = logContainer.scrollHeight;
				}
			});
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

	function setSource(next: LogSource) {
		if (source === next) return;
		source = next;
		startPolling();
	}

	onDestroy(() => {
		stopPolling();
	});

	$effect(() => {
		if (disabled) {
			stopPolling();
			lines = [];
		} else {
			startPolling();
		}
	});
</script>

<Item.Root variant="outline">
	<Item.Header class="flex flex-row items-center justify-between gap-4">
		<div>
			<Item.Title>Logs</Item.Title>
			<Item.Description>
				{source === 'server' ? 'Minecraft server output' : 'EC2 bootstrap logs'}
			</Item.Description>
		</div>
		<div class="flex gap-2">
			<Button
				variant={source === 'server' ? 'default' : 'outline'}
				size="sm"
				disabled={disabled}
				onclick={() => setSource('server')}
			>
				Server
			</Button>
			<Button
				variant={source === 'ec2' ? 'default' : 'outline'}
				size="sm"
				disabled={disabled}
				onclick={() => setSource('ec2')}
			>
				EC2
			</Button>
		</div>
	</Item.Header>
	<Item.Content>
		{#if disabled}
			<p class="text-muted-foreground text-sm">Start the server to view logs.</p>
		{:else if loading && lines.length === 0}
			<div class="flex items-center gap-2 py-8 text-sm text-muted-foreground">
				<Spinner />
				Loading logs...
			</div>
		{:else if errorMessage}
			<p class="text-destructive text-sm">{errorMessage}</p>
		{:else if lines.length === 0}
			<p class="text-muted-foreground text-sm">No logs yet.</p>
		{:else}
			<pre
				bind:this={logContainer}
				class="max-h-80 overflow-y-auto rounded-md border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap"
			>{lines.join('\n')}</pre>
		{/if}
	</Item.Content>
</Item.Root>
