import Stripe from 'stripe';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizationBalance } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function creditOrganizationBalance(organizationId: string, amountCents: number) {
	const addedDollars = amountCents / 100;

	const currentBalance = await db.query.organizationBalance.findFirst({
		where: (organizationBalance, { eq }) => eq(organizationBalance.organizationId, organizationId),
		columns: {
			amountDollars: true
		}
	});

	const newBalance = currentBalance
		? parseFloat(currentBalance.amountDollars) + addedDollars
		: addedDollars;

	if (currentBalance) {
		await db
			.update(organizationBalance)
			.set({ amountDollars: newBalance.toString() })
			.where(eq(organizationBalance.organizationId, organizationId));
		return;
	}

	await db.insert(organizationBalance).values({
		organizationId,
		amountDollars: newBalance.toString()
	});
}

async function fulfillAddFundsCheckout(sessionId: string) {
	const session = await stripe.checkout.sessions.retrieve(sessionId);

	if (session.metadata?.fulfilled === 'true') {
		return false;
	}

	if (session.mode !== 'payment' || session.payment_status !== 'paid') {
		return false;
	}

	const organizationId = session.metadata?.organizationId;
	const amountCents = session.amount_total;

	if (!organizationId || !amountCents) {
		return false;
	}

	await creditOrganizationBalance(organizationId, amountCents);

	await stripe.checkout.sessions.update(sessionId, {
		metadata: {
			...session.metadata,
			fulfilled: 'true'
		}
	});

	return true;
}

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

		try {
			await fulfillAddFundsCheckout(session.id);
		} catch (err) {
			console.error('Checkout fulfillment failed: ', err);
			throw error(500);
		}
	}

	return new Response(null, { status: 200 });
};
