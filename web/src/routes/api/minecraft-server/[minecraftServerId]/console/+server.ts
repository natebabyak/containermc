import { error, json } from '@sveltejs/kit';
import {
	assertServerAccess,
	runRconCommand,
	validateRconCommand
} from '$lib/server/instance-control';
import type { RequestHandler } from './$types';

export const config = {
	maxDuration: 60
};

export const POST: RequestHandler = async (event) => {
	const { server } = await assertServerAccess(event, event.params.minecraftServerId, {
		requireRunning: true
	});

	let body: { command?: string };
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const command = validateRconCommand(body.command ?? '');

	try {
		const output = await runRconCommand(server.instanceId!, command);
		return json({ output: output.trim() });
	} catch (err) {
		throw error(
			502,
			err instanceof Error ? err.message : 'Failed to execute command'
		);
	}
};
