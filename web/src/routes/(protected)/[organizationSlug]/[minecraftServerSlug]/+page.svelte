<script lang="ts">
	import type { PageProps } from './$types';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortableItem from './_components/sortable-item.svelte';
	import type { DragEndEvent, DragOverEvent } from '@dnd-kit/abstract';
	import ServerItem from '$lib/components/server-item.svelte';
	import ServerStatCards from './_components/server-stat-cards.svelte';
	import ServerConsole from './_components/server-console.svelte';
	import ServerLogs from './_components/server-logs.svelte';
	import { onDestroy } from 'svelte';
	import { computeSessionCost } from '$lib/helpers';
	import { isLiveMetricsRange } from '$lib/time-range';

	let { data }: PageProps = $props();

	let server = $derived(data.activeMinecraftServer);
	let isRunning = $derived(server.status === 'running');
	let showNowPoint = $derived(isRunning && isLiveMetricsRange(data.range));

	interface LiveMetrics {
		players: number;
		tps: number;
		cpu: number;
		memory: number;
	}

	let liveNowMetrics = $state<LiveMetrics | null>(null);

	let chartData = $derived.by(() => {
		const points = data.chartData;
		if (!liveNowMetrics) {
			return points;
		}

		const nowIndex = points.findIndex((point) => point.time === 'Now');
		if (nowIndex === -1) {
			return points;
		}

		const activeSession = server.sessions.find((session) => !session.endedAt);
		const cost = activeSession
			? computeSessionCost(activeSession.hardwareName, activeSession.startedAt, new Date())
			: 0;

		return points.map((point, index) =>
			index === nowIndex
				? {
						...point,
						players: liveNowMetrics!.players,
						cpu: liveNowMetrics!.cpu,
						memory: liveNowMetrics!.memory,
						tps: liveNowMetrics!.tps,
						cost
					}
				: point
		);
	});

	let metricsInterval: ReturnType<typeof setInterval> | null = null;

	const chartPanels = [
		{
			id: 'billing',
			title: 'Session cost',
			seriesKey: 'cost' as const,
			seriesLabel: 'Cost',
			color: 'var(--chart-1)'
		},
		{
			id: 'players',
			title: 'Players',
			seriesKey: 'players' as const,
			seriesLabel: 'Players',
			color: 'var(--chart-2)'
		},
		{
			id: 'cpu',
			title: 'CPU',
			seriesKey: 'cpu' as const,
			seriesLabel: 'CPU %',
			color: 'var(--chart-3)'
		},
		{
			id: 'memory',
			title: 'Memory',
			seriesKey: 'memory' as const,
			seriesLabel: 'Memory %',
			color: 'var(--chart-4)'
		},
		{
			id: 'tps',
			title: 'TPS',
			seriesKey: 'tps' as const,
			seriesLabel: 'TPS',
			color: 'var(--chart-5)'
		}
	];

	let panelOrder = $state(chartPanels.map((panel) => panel.id));
	let snapshot = $state<string[]>([]);

	function onDragStart() {
		snapshot = panelOrder.slice();
	}

	function onDragOver(event: DragOverEvent) {
		panelOrder = move(panelOrder, event);
	}

	function onDragEnd(event: DragEndEvent) {
		if (event.canceled) panelOrder = snapshot;
	}

	async function fetchLatestMetrics() {
		if (!showNowPoint) return;

		try {
			const response = await fetch(
				`/api/minecraft-server/${server.id}/metrics/latest?live=1`
			);
			if (!response.ok) return;

			const payload = await response.json();
			if (!payload.metrics) return;

			liveNowMetrics = payload.metrics;
		} catch {
			// Ignore polling errors.
		}
	}

	function startMetricsPolling() {
		stopMetricsPolling();
		if (!showNowPoint) return;

		void fetchLatestMetrics();
		metricsInterval = setInterval(() => {
			if (document.visibilityState === 'visible') {
				void fetchLatestMetrics();
			}
		}, 30000);
	}

	function stopMetricsPolling() {
		if (metricsInterval) {
			clearInterval(metricsInterval);
			metricsInterval = null;
		}
	}

	onDestroy(() => {
		stopMetricsPolling();
	});

	$effect(() => {
		data.range;
		liveNowMetrics = null;
	});

	$effect(() => {
		if (showNowPoint) {
			startMetricsPolling();
		} else {
			liveNowMetrics = null;
			stopMetricsPolling();
		}
	});
</script>

<svelte:head>
	<title>{server.name} - ContainerMC</title>
</svelte:head>

<div class="min-w-0 max-w-full space-y-4 overflow-hidden">
	<h1 class="text-2xl font-medium">{server.name}</h1>
	<ServerStatCards metrics={data.averageMetrics} range={data.range} />
	<ServerConsole serverId={server.id} disabled={!isRunning} />
	<ServerLogs serverId={server.id} disabled={!isRunning} />
	<ServerItem {server} />
	<DragDropProvider {onDragStart} {onDragOver} {onDragEnd}>
		<div class="grid-col-1 grid min-w-0 gap-4 lg:grid-cols-2">
			{#each panelOrder as panelId, index (panelId)}
				{@const panel = chartPanels.find((entry) => entry.id === panelId)!}
				<SortableItem
					id={panel.id}
					{index}
					title={panel.title}
					seriesKey={panel.seriesKey}
					seriesLabel={panel.seriesLabel}
					color={panel.color}
					data={chartData}
					range={data.range}
				/>
			{/each}
		</div>
	</DragDropProvider>
</div>
