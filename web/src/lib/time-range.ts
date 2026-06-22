export const TIME_RANGES = ['1h', '24h', '7d', '30d'] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export function parseTimeRange(value: string | null): TimeRange {
	if (value && TIME_RANGES.includes(value as TimeRange)) {
		return value as TimeRange;
	}
	return '24h';
}

export function getRangeMs(range: TimeRange): number {
	switch (range) {
		case '1h':
			return 60 * 60 * 1000;
		case '24h':
			return 24 * 60 * 60 * 1000;
		case '7d':
			return 7 * 24 * 60 * 60 * 1000;
		case '30d':
			return 30 * 24 * 60 * 60 * 1000;
	}
}

export function getBucketMs(range: TimeRange): number {
	switch (range) {
		case '1h':
			return 5 * 60 * 1000;
		case '24h':
			return 60 * 60 * 1000;
		case '7d':
		case '30d':
			return 24 * 60 * 60 * 1000;
	}
}

export function formatBucketLabel(date: Date, range: TimeRange): string {
	switch (range) {
		case '1h':
		case '24h':
			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		case '7d':
			return date.toLocaleDateString('en-US', { weekday: 'short' });
		case '30d':
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
}

export function getRangeLabel(range: TimeRange): string {
	switch (range) {
		case '1h':
			return 'Last hour';
		case '24h':
			return 'Last day';
		case '7d':
			return 'Last week';
		case '30d':
			return 'Last month';
	}
}
