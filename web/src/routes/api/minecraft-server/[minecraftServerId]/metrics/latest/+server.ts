import { desc, eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { minecraftServerSnapshot } from '$lib/server/db/schema';
import { assertServerAccess } from '$lib/server/instance-control';
import { fetchLiveMetrics } from '$lib/server/metrics-collector';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const { server } = await assertServerAccess(event, event.params.minecraftServerId);

	const latestSnapshot = await db.query.minecraftServerSnapshot.findFirst({
		where: eq(minecraftServerSnapshot.minecraftServerId, server.id),
		orderBy: desc(minecraftServerSnapshot.createdAt)
	});

	const snapshotMetrics = latestSnapshot
		? {
				players: latestSnapshot.numPlayers,
				tps: Number(latestSnapshot.tps),
				cpu: Number(latestSnapshot.cpuUsagePct),
				memory: Number(latestSnapshot.memoryUsagePct),
				collectedAt: latestSnapshot.createdAt.toISOString()
			}
		: null;

	const live = event.url.searchParams.get('live') === '1';

	if (live && server.status === 'running' && server.instanceId) {
		try {
			const metrics = await fetchLiveMetrics({
				id: server.id,
				instanceId: server.instanceId
			});
			return json({ metrics, source: 'live' as const });
		} catch (err) {
			console.error('Live metrics fetch failed:', err);
		}
	}

	if (!snapshotMetrics) {
		return json({ metrics: null, source: 'snapshot' as const });
	}

	return json({ metrics: snapshotMetrics, source: 'snapshot' as const });
};
