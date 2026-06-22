import { computeIntervalCost, computeSessionCost } from '$lib/helpers';
import type { ServerAverageMetrics, ServerChartPoint, TimeRange } from '$lib/server-dashboard';
import {
	formatBucketLabel,
	getBucketMs,
	getRangeMs
} from '$lib/time-range';
import { db } from '$lib/server/db';
import { minecraftServerSnapshot } from '$lib/server/db/schema';
import type { MinecraftServerSessionSelect, MinecraftServerSelect } from '$lib/types';
import { and, asc, eq, gte } from 'drizzle-orm';

function average(values: number[]): number {
	if (values.length === 0) {
		return 0;
	}
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sessionOverlapsRange(
	session: Pick<MinecraftServerSessionSelect, 'startedAt' | 'endedAt'>,
	rangeStart: Date,
	now: Date
): boolean {
	return session.startedAt < now && (session.endedAt === null || session.endedAt > rangeStart);
}

function computeAverageMetrics(
	snapshots: {
		numPlayers: number;
		cpuUsagePct: string;
		memoryUsagePct: string;
		tps: string;
	}[]
): ServerAverageMetrics | null {
	if (snapshots.length === 0) {
		return null;
	}

	return {
		players: average(snapshots.map((snapshot) => snapshot.numPlayers)),
		cpu: average(snapshots.map((snapshot) => Number(snapshot.cpuUsagePct))),
		memory: average(snapshots.map((snapshot) => Number(snapshot.memoryUsagePct))),
		tps: average(snapshots.map((snapshot) => Number(snapshot.tps)))
	};
}

export async function getServerDashboardData(
	server: MinecraftServerSelect & { sessions: MinecraftServerSessionSelect[] },
	range: TimeRange
) {
	const now = new Date();
	const rangeStart = new Date(now.getTime() - getRangeMs(range));
	const bucketMs = getBucketMs(range);
	const bucketCount = Math.ceil(getRangeMs(range) / bucketMs);

	const snapshots = await db.query.minecraftServerSnapshot.findMany({
		where: and(
			eq(minecraftServerSnapshot.minecraftServerId, server.id),
			gte(minecraftServerSnapshot.createdAt, rangeStart)
		),
		orderBy: asc(minecraftServerSnapshot.createdAt)
	});

	const chartData: ServerChartPoint[] = [];

	for (let i = 0; i < bucketCount; i++) {
		const bucketStart = new Date(rangeStart.getTime() + i * bucketMs);
		const bucketEnd = new Date(Math.min(bucketStart.getTime() + bucketMs, now.getTime()));

		if (bucketStart >= now) {
			break;
		}

		const bucketSnapshots = snapshots.filter(
			(snapshot) => snapshot.createdAt >= bucketStart && snapshot.createdAt < bucketEnd
		);

		let cost = 0;
		for (const session of server.sessions) {
			if (!sessionOverlapsRange(session, rangeStart, now)) {
				continue;
			}

			const sessionEnd = session.endedAt ?? now;
			const overlapStart = new Date(
				Math.max(session.startedAt.getTime(), bucketStart.getTime())
			);
			const overlapEnd = new Date(Math.min(sessionEnd.getTime(), bucketEnd.getTime()));

			cost += computeIntervalCost(session.hardwareName, overlapStart, overlapEnd);
		}

		chartData.push({
			time: formatBucketLabel(bucketStart, range),
			players: average(bucketSnapshots.map((snapshot) => snapshot.numPlayers)),
			cpu: average(bucketSnapshots.map((snapshot) => Number(snapshot.cpuUsagePct))),
			memory: average(bucketSnapshots.map((snapshot) => Number(snapshot.memoryUsagePct))),
			tps: average(bucketSnapshots.map((snapshot) => Number(snapshot.tps))),
			cost
		});
	}

	const activeSession = server.sessions.find((session) => !session.endedAt);

	if (activeSession && (range === '1h' || range === '24h')) {
		const latestSnapshot = snapshots.at(-1);
		chartData.push({
			time: 'Now',
			players: latestSnapshot?.numPlayers ?? 0,
			cpu: latestSnapshot ? Number(latestSnapshot.cpuUsagePct) : 0,
			memory: latestSnapshot ? Number(latestSnapshot.memoryUsagePct) : 0,
			tps: latestSnapshot ? Number(latestSnapshot.tps) : 20,
			cost: computeSessionCost(activeSession.hardwareName, activeSession.startedAt, now)
		});
	}

	return {
		range,
		chartData,
		averageMetrics: computeAverageMetrics(snapshots)
	};
}
