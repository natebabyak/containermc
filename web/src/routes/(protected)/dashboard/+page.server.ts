import { auth } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		throw redirect(303, '/sign-up');
	}

	const activeOrganization = await auth.api.getFullOrganization({
		query: {
			organizationId: locals.session.activeOrganizationId
		},
		headers: request.headers
	});

	if (!activeOrganization) {
		throw error(404, 'Organization not found');
	}

	redirect(303, `/${activeOrganization.slug}`);
};
