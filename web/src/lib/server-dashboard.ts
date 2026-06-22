import type { TimeRange } from '$lib/time-range';

export type ServerChartPoint = {
	time: string;
	players: number;
	cpu: number;
	memory: number;
	tps: number;
	cost: number;
};

export type ServerAverageMetrics = {
	players: number;
	tps: number;
	cpu: number;
	memory: number;
};

export type ServerDashboardData = {
	range: TimeRange;
	chartData: ServerChartPoint[];
	averageMetrics: ServerAverageMetrics | null;
};

export type { TimeRange } from '$lib/time-range';
export {
	parseTimeRange,
	getRangeLabel,
	TIME_RANGES
} from '$lib/time-range';
