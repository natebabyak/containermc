<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { LineChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import * as Select from '$lib/components/ui/select/index.js';
	import { createSortable } from '@dnd-kit/svelte/sortable';

	interface Props {
		id: number;
		index: number;
	}

	let { id, index }: Props = $props();

	const sortable = createSortable({
		get id() {
			return id;
		},
		get index() {
			return index;
		}
	});

	const chartConfig = {
		numPlayers: {
			label: 'Players',
			color: 'var(--chart-1)'
		}
	} satisfies Chart.ChartConfig;

	const chartData = [
		{ month: 'January', numPlayers: 186 },
		{ month: 'February', numPlayers: 305 },
		{ month: 'March', numPlayers: 237 },
		{ month: 'April', numPlayers: 73 },
		{ month: 'May', numPlayers: 209 },
		{ month: 'June', numPlayers: 214 }
	];
</script>

<Item.Root variant="outline" class="bg-background" {@attach sortable.attach}>
	<Item.Header>
		<Item.Title>Player Count</Item.Title>
		<Item.Actions>
			<Select.Root type="single" value="d">
				<Select.Trigger>1D</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Item value="d">24H</Select.Item>
						<Select.Item value="w">7D</Select.Item>
						<Select.Item value="m">30D</Select.Item>
						<Select.Item value="y">1Y</Select.Item>
						<Select.Item value="all">All</Select.Item>
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</Item.Actions>
	</Item.Header>
	<Item.Content>
		<Chart.Container config={chartConfig} class="min-h-50 w-full">
			<LineChart
				data={chartData}
				xScale={scaleBand().padding(0.25)}
				x="month"
				axis="x"
				seriesLayout="group"
				series={[
					{
						key: 'numPlayers',
						label: chartConfig.numPlayers.label,
						color: chartConfig.numPlayers.color
					}
				]}
			/>
		</Chart.Container>
	</Item.Content>
	<Item.Footer>Insight goes here</Item.Footer>
</Item.Root>
