import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { slug } = params;

	const server = await db.query.server.findFirst({
		where: (server, { eq }) => eq(server.slug, slug)
	});

	if (!server) {
		throw new Error('Server not found');
	}

	if (server.userId !== locals.user.id) {
		throw new Error('Unauthorized');
	}

	return {
		server
	};
};
