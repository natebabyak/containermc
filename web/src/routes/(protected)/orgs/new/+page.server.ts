import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { auth } from '$lib/server/auth';

export const actions = {
	createOrganization: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const slug = formData.get('slug')?.toString();

		if (!name || !slug) {
			return fail(400, 'Name and slug are required');
		}

		await auth.api.createOrganization({
			body: {
				name,
				slug,
				userId: event.locals.user.id,
				isPersonal: true
			}
		});
	}
} satisfies Actions;
