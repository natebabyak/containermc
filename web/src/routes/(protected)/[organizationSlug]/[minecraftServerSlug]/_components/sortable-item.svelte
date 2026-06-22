<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import { formatBalance } from '$lib/formatters';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { LineChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { createSortable } from '@dnd-kit/svelte/sortable';
	import TimeRangeSelect from '$lib/components/time-range-select.svelte';
	import type { TimeRange } from '$lib/time-range';

	interface ChartPoint {
		time: string;
		players: number;
		cpu: number;
		memory: number;
		tps: number;
		cost: number;
	}

	interface Props {
		id: string;
		index: number;
		title: string;
		seriesKey: keyof ChartPoint;
		seriesLabel: string;
		color: string;
		data: ChartPoint[];
		range: TimeRange;
	}

	let { id, index, title, seriesKey, seriesLabel, color, data, range }: Props = $props();

	const sortable = createSortable({
		get id() {
			return id;
		},
		get index() {
			return index;
		}
	});

	const chartConfig = $derived({
		[seriesKey]: {
			label: seriesLabel,
			color
		}
	} satisfies Chart.ChartConfig);

	const valueFormatter = $derived(
		seriesKey === 'cost' ? (value: number) => formatBalance(value) : undefined
	);
</script>

<Item.Root variant="outline" class="bg-background min-w-0 w-full max-w-full overflow-hidden" {@attach sortable.attach}>
	<Item.Header class="flex flex-row items-center justify-between gap-4">
		<Item.Title>{title}</Item.Title>
		<TimeRangeSelect value={range} />
	</Item.Header>
	<Item.Content>
		{#if data.length > 0}
			<Chart.Container config={chartConfig} class="min-h-50 min-w-0 w-full">
				<LineChart
					{data}
					xScale={scaleBand().padding(0.25)}
					x="time"
					axis="x"
					seriesLayout="group"
					tooltipContext={false}
					series={[
						{
							key: seriesKey,
							label: seriesLabel,
							color
						}
					]}
					props={{
						yAxis: valueFormatter ? { format: valueFormatter } : undefined
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip />
					{/snippet}
				</LineChart>
			</Chart.Container>
		{:else}
			<p class="text-muted-foreground py-8 text-center text-sm">
				No metrics in this time range.
			</p>
		{/if}
	</Item.Content>
</Item.Root>
