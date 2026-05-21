import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const servers = await db.query.server.findMany({
		where: (server, { eq }) => eq(server.userId, locals.user.id)
	});

	return {
		servers
	};
};
