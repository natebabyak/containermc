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
			const stripeCustomerId = session.customer as string;
			const amountCents = session.amount_total as number;

			try {
				await db
					.update(userBalance)
					.set({ amountDollars: (amountCents / 100).toString() })
					.where(eq(userBalance.userId, stripeCustomerId));
			} catch {
				throw error(500);
			}
		}
	}

	return new Response(null, { status: 200 });
};
