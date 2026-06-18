import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		throw redirect(303, '/sign-up');
	}

	return {
		organizations: await auth.api.listOrganizations({
			query: {
				userId: locals.user.id
			},
			headers: request.headers
		})
	};
};
