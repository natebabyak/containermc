import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { minecraftServer } from '$lib/server/db/schema';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const { minecraftServerId } = params;

	const result = await db.query.minecraftServer.findFirst({
		where: eq(minecraftServer.id, minecraftServerId),
		columns: {
			status: true
		}
	});

	if (!result) {
		throw error(404, 'Minecraft server not found');
	}

	return json({ status: result.status });
};
