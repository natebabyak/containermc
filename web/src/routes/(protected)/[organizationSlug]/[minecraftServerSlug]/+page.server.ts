import { computeSessionCost } from '$lib/helpers';
import { db } from '$lib/server/db';
import { minecraftServerSnapshot } from '$lib/server/db/schema';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { activeMinecraftServer } = await parent();
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

	const snapshots = await db.query.minecraftServerSnapshot.findMany({
		where: and(
			eq(minecraftServerSnapshot.minecraftServerId, activeMinecraftServer.id),
			gte(minecraftServerSnapshot.createdAt, since)
		),
		orderBy: asc(minecraftServerSnapshot.createdAt)
	});

	const latestSnapshot = await db.query.minecraftServerSnapshot.findFirst({
		where: eq(minecraftServerSnapshot.minecraftServerId, activeMinecraftServer.id),
		orderBy: desc(minecraftServerSnapshot.createdAt)
	});

	const activeSession = activeMinecraftServer.sessions.find((session) => !session.endedAt);

	const chartData = snapshots.map((snapshot) => ({
		time: snapshot.createdAt.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		}),
		players: snapshot.numPlayers,
		cpu: Number(snapshot.cpuUsagePct),
		memory: Number(snapshot.memoryUsagePct),
		tps: Number(snapshot.tps),
		cost: activeSession
			? computeSessionCost(activeSession.hardwareName, activeSession.startedAt, snapshot.createdAt)
			: 0
	}));

	if (activeSession) {
		const now = new Date();
		chartData.push({
			time: 'Now',
			players: chartData.at(-1)?.players ?? 0,
			cpu: chartData.at(-1)?.cpu ?? 0,
			memory: chartData.at(-1)?.memory ?? 0,
			tps: chartData.at(-1)?.tps ?? 20,
			cost: computeSessionCost(activeSession.hardwareName, activeSession.startedAt, now)
		});
	}

	const latestMetrics = latestSnapshot
		? {
				players: latestSnapshot.numPlayers,
				tps: Number(latestSnapshot.tps),
				cpu: Number(latestSnapshot.cpuUsagePct),
				memory: Number(latestSnapshot.memoryUsagePct),
				collectedAt: latestSnapshot.createdAt.toISOString()
			}
		: null;

	return {
		chartData,
		latestMetrics
	};
};
