import { shouldStopForBalance } from '$lib/server/billing';
import { assertCronAuth } from '$lib/server/cron-auth';
import { db } from '$lib/server/db';
import { stopServer } from '$lib/server/minecraft-servers';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	assertCronAuth(request);

	const activeSessions = await db.query.minecraftServerSession.findMany({
		where: (session, { isNull }) => isNull(session.endedAt),
		with: {
			server: {
				columns: {
					id: true,
					organizationId: true,
					status: true
				}
			}
		}
	});

	const stopped: string[] = [];
	const errors: { serverId: string; message: string }[] = [];

	for (const session of activeSessions) {
		if (!session.server || session.server.status !== 'running') {
			continue;
		}

		try {
			const shouldStop = await shouldStopForBalance(session.server.organizationId, {
				hardwareName: session.hardwareName,
				startedAt: session.startedAt
			});

			if (shouldStop) {
				await stopServer(session.server.id);
				stopped.push(session.server.id);
			}
		} catch (err) {
			errors.push({
				serverId: session.server.id,
				message: err instanceof Error ? err.message : 'Unknown error'
			});
		}
	}

	return json({ stopped, errors });
};
