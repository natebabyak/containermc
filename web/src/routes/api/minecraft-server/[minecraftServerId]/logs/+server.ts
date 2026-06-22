import { error, json } from '@sveltejs/kit';
import { assertServerAccess, getServerLogs, type LogSource } from '$lib/server/instance-control';
import type { RequestHandler } from './$types';

export const config = {
	maxDuration: 60
};

function parseLogSource(value: string | null): LogSource {
	if (value === 'server' || value === 'ec2') {
		return value;
	}
	throw error(400, 'Invalid log source');
}

export const GET: RequestHandler = async (event) => {
	const { server } = await assertServerAccess(event, event.params.minecraftServerId, {
		requireRunning: true
	});

	const source = parseLogSource(event.url.searchParams.get('source') ?? 'server');
	const cursor = event.url.searchParams.get('cursor') ?? undefined;

	try {
		const result = await getServerLogs(server.id, server.instanceId!, source, { cursor });
		return json(result);
	} catch (err) {
		throw error(502, err instanceof Error ? err.message : 'Failed to fetch logs');
	}
};
