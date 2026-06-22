<script lang="ts">
	import StatCard from '../../_components/stat-card.svelte';
	import type { ServerAverageMetrics } from '$lib/server-dashboard';
	import { getRangeLabel, type TimeRange } from '$lib/time-range';

	interface Props {
		metrics: ServerAverageMetrics | null;
		range: TimeRange;
	}

	let { metrics, range }: Props = $props();

	const rangeLabel = $derived(getRangeLabel(range));
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<StatCard
		title="Players"
		value={metrics ? metrics.players.toFixed(1) : '—'}
		description={`Avg over ${rangeLabel.toLowerCase()}`}
	/>
	<StatCard
		title="TPS"
		value={metrics ? metrics.tps.toFixed(1) : '—'}
		description={`Avg over ${rangeLabel.toLowerCase()}`}
	/>
	<StatCard
		title="CPU"
		value={metrics ? `${metrics.cpu.toFixed(1)}%` : '—'}
		description={`Avg over ${rangeLabel.toLowerCase()}`}
	/>
	<StatCard
		title="Memory"
		value={metrics ? `${metrics.memory.toFixed(1)}%` : '—'}
		description={`Avg over ${rangeLabel.toLowerCase()}`}
	/>
</div>
