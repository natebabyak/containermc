export const TIME_RANGES = ['1h', '24h', '7d', '30d'] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export type SpendChartSeries = {
	key: string;
	label: string;
	color: string;
};

export type SpendChartPoint = {
	time: string;
} & Record<string, number | string>;

export function parseTimeRange(value: string | null): TimeRange {
	if (value && TIME_RANGES.includes(value as TimeRange)) {
		return value as TimeRange;
	}
	return '24h';
}
