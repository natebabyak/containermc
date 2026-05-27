import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	const { slug } = params;

	const server = await db.query.server.findFirst({
		where: (server, { eq }) => eq(server.slug, slug)
	});

	if (!server) {
		error(404, 'Server not found');
	}

	if (server.userId !== locals.user.id) {
		error(403, 'Forbidden');
	}

	return {
		server
	};
};
