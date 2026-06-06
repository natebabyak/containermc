import Stripe from 'stripe';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userBalance } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();

	const signature = request.headers.get('stripe-signature');
	if (!signature) throw error(400);

	let event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
	} catch {
		throw error(400);
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session;

		if (session.payment_status === 'paid') {
			const userId = session.metadata?.userId;
			const amountCents = session.amount_total;

			if (!userId || !amountCents) throw error(400);

			const addedDollars = amountCents / 100;

			try {
				const currentBalance = await db
					.select({ amountDollars: userBalance.amountDollars })
					.from(userBalance)
					.where(eq(userBalance.userId, userId))
					.limit(1);

				const newBalance = currentBalance[0]?.amountDollars
					? parseFloat(currentBalance[0].amountDollars) + addedDollars
					: addedDollars;

				await db
					.update(userBalance)
					.set({
						amountDollars: newBalance.toString()
					})
					.where(eq(userBalance.userId, userId));
			} catch (err) {
				console.error('Database Update Failed: ', err);
				throw error(500);
			}
		}
	}

	return new Response(null, { status: 200 });
};
