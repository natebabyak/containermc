import { db } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const userBalance = await db.query.userBalance.findFirst({
		where: (userBalance, { eq }) => eq(userBalance.userId, locals.user.id)
	});

	if (!userBalance) throw new Error('User balance not found');

	return {
		balance: userBalance.balanceDollars
	};
};
