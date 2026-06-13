import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	const { minecraftServerSlug } = params;

	const activeMinecraftServer = await db.query.minecraftServer.findFirst({
		where: (minecraftServer, { eq }) => eq(minecraftServer.slug, minecraftServerSlug),
		with: {
			mods: true,
			sessions: true,
			backups: true,
			snapshots: true
		}
	});

	if (!activeMinecraftServer) {
		error(404, 'Server not found');
	}

	return {
		activeMinecraftServer
	};
};
