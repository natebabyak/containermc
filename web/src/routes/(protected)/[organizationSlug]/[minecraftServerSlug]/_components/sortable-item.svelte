<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import { formatBalance } from '$lib/formatters';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { LineChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { createSortable } from '@dnd-kit/svelte/sortable';

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
	}

	let { id, index, title, seriesKey, seriesLabel, color, data }: Props = $props();

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

<Item.Root variant="outline" class="bg-background" {@attach sortable.attach}>
	<Item.Header>
		<Item.Title>{title}</Item.Title>
	</Item.Header>
	<Item.Content>
		{#if data.length > 0}
			<Chart.Container config={chartConfig} class="min-h-50 w-full">
				<LineChart
					{data}
					xScale={scaleBand().padding(0.25)}
					x="time"
					axis="x"
					seriesLayout="group"
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
				/>
			</Chart.Container>
		{:else}
			<p class="text-muted-foreground py-8 text-center text-sm">
				No data yet. Metrics appear while the server is running.
			</p>
		{/if}
	</Item.Content>
</Item.Root>
