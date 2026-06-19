<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { formatBalance } from '$lib/formatters';
	import type { SpendChartPoint, SpendChartSeries } from '$lib/organization-dashboard';
	import { BarChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';

	interface Props {
		data: SpendChartPoint[];
		series: SpendChartSeries[];
		hasSpend: boolean;
	}

	let { data, series, hasSpend }: Props = $props();

	const chartConfig = $derived(
		Object.fromEntries(
			series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])
		) satisfies Chart.ChartConfig
	);

	const chartSeries = $derived(
		series.map((entry) => ({
			key: entry.key,
			label: entry.label,
			color: entry.color
		}))
	);
</script>

{#if hasSpend && data.length > 0 && series.length > 0}
	<Chart.Container config={chartConfig} class="min-h-72 w-full">
		<BarChart
			{data}
			x="time"
			xScale={scaleBand().padding(0.25)}
			axis="x"
			series={chartSeries}
			seriesLayout="stack"
			legend={true}
			props={{
				yAxis: { format: (value: number) => formatBalance(value) }
			}}
		/>
	</Chart.Container>
{:else}
	<p class="text-muted-foreground py-8 text-center text-sm">No usage in this period</p>
{/if}
