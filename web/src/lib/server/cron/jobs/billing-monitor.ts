import { shouldStopForBalance } from '$lib/server/billing';
import { db } from '$lib/server/db';
import { stopServer } from '$lib/server/minecraft-servers';

export type BillingMonitorResult = {
	stopped: string[];
	errors: { serverId: string; message: string }[];
};

export async function runBillingMonitor(): Promise<BillingMonitorResult> {
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

	return { stopped, errors };
}
