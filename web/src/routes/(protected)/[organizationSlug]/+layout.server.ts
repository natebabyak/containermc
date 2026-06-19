import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals, params, request }) => {
	const { organizationSlug } = params;

	const activeOrganization = await auth.api.getFullOrganization({
		query: {
			organizationSlug
		},
		headers: request.headers
	});

	if (!activeOrganization) {
		throw error(404, 'Organization not found');
	}

	const isMember = activeOrganization.members.some((member) => member.userId === locals.user.id);

	if (!isMember) {
		error(404, 'Organization not found');
	}

	await auth.api.setActiveOrganization({
		body: {
			organizationId: activeOrganization.id
		},
		headers: request.headers
	});

	const activeOrganizationBalance = await db.query.organizationBalance.findFirst({
		where: (organizationBalance, { eq }) =>
			eq(organizationBalance.organizationId, activeOrganization.id),
		columns: {
			amountDollars: true
		}
	});

	if (!activeOrganizationBalance) {
		throw error(404, 'Organization balance not found');
	}

	const minecraftServers = await db.query.minecraftServer.findMany({
		where: (minecraftServer, { eq }) => eq(minecraftServer.organizationId, activeOrganization.id)
	});

	return {
		activeOrganization,
		activeOrganizationBalance: parseFloat(activeOrganizationBalance.amountDollars),
		minecraftServers
	};
};
