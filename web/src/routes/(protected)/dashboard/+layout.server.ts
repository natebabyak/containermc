import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const userBalance = await db.query.userBalance.findFirst({
		where: (userBalance, { eq }) => eq(userBalance.userId, locals.user.id)
	});

	if (!userBalance) {
		error(404, {
			message: 'User balance not found'
		});
	}

	const servers = await db.query.minecraftServer.findMany({
		where: (server, { eq }) => eq(server.userId, locals.user.id)
	});

	return {
		balance: userBalance.amountDollars,
		servers
	};
};
