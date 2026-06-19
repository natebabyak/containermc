import { HARDWARE_OPTIONS } from '$lib/constants';
import { computeIntervalCost } from '$lib/helpers';
import type { SpendChartPoint, SpendChartSeries, TimeRange } from '$lib/organization-dashboard';
import { db } from '$lib/server/db';
import { getMinimumStartBalance, getOrganizationTransactions } from '$lib/server/billing';

export type { SpendChartPoint, SpendChartSeries, TimeRange } from '$lib/organization-dashboard';
export { parseTimeRange } from '$lib/organization-dashboard';

function getRangeMs(range: TimeRange): number {
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

function getBucketMs(range: TimeRange): number {
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

function formatBucketLabel(date: Date, range: TimeRange): string {
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

function sessionOverlapsRange(
	session: { startedAt: Date; endedAt: Date | null },
	rangeStart: Date,
	now: Date
): boolean {
	return session.startedAt < now && (session.endedAt === null || session.endedAt > rangeStart);
}

const CHART_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)'
];

export async function getOrganizationDashboardData(organizationId: string, range: TimeRange) {
	const now = new Date();
	const rangeStart = new Date(now.getTime() - getRangeMs(range));
	const bucketMs = getBucketMs(range);
	const bucketCount = Math.ceil(getRangeMs(range) / bucketMs);

	const servers = await db.query.minecraftServer.findMany({
		where: (minecraftServer, { eq }) => eq(minecraftServer.organizationId, organizationId),
		with: {
			sessions: true
		}
	});

	const spendChartSeries: SpendChartSeries[] = servers.map((server, index) => ({
		key: server.slug,
		label: server.name,
		color: CHART_COLORS[index % CHART_COLORS.length]
	}));

	const spendChart: SpendChartPoint[] = [];
	let rangeTotalSpend = 0;

	for (let i = 0; i < bucketCount; i++) {
		const bucketStart = new Date(rangeStart.getTime() + i * bucketMs);
		const bucketEnd = new Date(Math.min(bucketStart.getTime() + bucketMs, now.getTime()));

		if (bucketStart >= now) {
			break;
		}

		const point: SpendChartPoint = {
			time: formatBucketLabel(bucketStart, range)
		};

		for (const server of servers) {
			let bucketCost = 0;

			for (const session of server.sessions) {
				if (!sessionOverlapsRange(session, rangeStart, now)) {
					continue;
				}

				const sessionEnd = session.endedAt ?? now;
				const overlapStart = new Date(
					Math.max(session.startedAt.getTime(), bucketStart.getTime())
				);
				const overlapEnd = new Date(Math.min(sessionEnd.getTime(), bucketEnd.getTime()));

				bucketCost += computeIntervalCost(
					session.hardwareName,
					overlapStart,
					overlapEnd
				);
			}

			point[server.slug] = bucketCost;
			rangeTotalSpend += bucketCost;
		}

		spendChart.push(point);
	}

	const liveBurnRate = servers.reduce((total, server) => {
		const activeSession = server.sessions.find((session) => session.endedAt === null);
		if (!activeSession) {
			return total;
		}

		const hourlyRate =
			HARDWARE_OPTIONS.find((option) => option.name === activeSession.hardwareName)?.hourlyRate ??
			0;
		return total + hourlyRate;
	}, 0);

	const recentTransactions = await getOrganizationTransactions(organizationId, 5);

	return {
		range,
		spendChart,
		spendChartSeries,
		recentTransactions,
		liveBurnRate,
		rangeTotalSpend,
		lowBalanceThreshold: getMinimumStartBalance('Small'),
		servers
	};
}
