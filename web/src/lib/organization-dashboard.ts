export type SpendChartSeries = {
	key: string;
	label: string;
	color: string;
};

export type SpendChartPoint = {
	time: string;
} & Record<string, number | string>;

export type { TimeRange } from '$lib/time-range';
export {
	parseTimeRange,
	getRangeLabel,
	TIME_RANGES
} from '$lib/time-range';
