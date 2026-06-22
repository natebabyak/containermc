<script lang="ts">
	import StatCard from '../../_components/stat-card.svelte';

	interface Metrics {
		players: number;
		tps: number;
		cpu: number;
		memory: number;
	}

	interface Props {
		metrics: Metrics | null;
		isRunning: boolean;
	}

	let { metrics, isRunning }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<StatCard
		title="Players"
		value={metrics ? String(metrics.players) : isRunning ? '—' : '0'}
		description={isRunning ? 'Online now' : 'Server stopped'}
	/>
	<StatCard
		title="TPS"
		value={metrics ? metrics.tps.toFixed(1) : isRunning ? '—' : '—'}
		description="Ticks per second"
	/>
	<StatCard
		title="CPU"
		value={metrics ? `${metrics.cpu.toFixed(1)}%` : isRunning ? '—' : '—'}
		description="Host CPU usage"
	/>
	<StatCard
		title="Memory"
		value={metrics ? `${metrics.memory.toFixed(1)}%` : isRunning ? '—' : '—'}
		description="Host memory usage"
	/>
</div>
