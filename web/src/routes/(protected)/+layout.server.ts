import { auth } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		redirect(303, '/sign-up');
	}

	const organizations = await auth.api.listOrganizations({
		query: { userId: locals.user.id },
		headers: request.headers
	});

	return { organizations };
};
