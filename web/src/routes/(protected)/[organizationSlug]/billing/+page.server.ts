import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { formatCurrency } from '$lib/formatters';
import { auth } from '$lib/server/auth';
import { creditDeposit, getOrganizationTransactions } from '$lib/server/billing';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function fulfillAddFundsCheckout(sessionId: string, expectedOrganizationId?: string) {
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

	if (expectedOrganizationId && organizationId !== expectedOrganizationId) {
		return false;
	}

	await creditDeposit(organizationId, amountCents / 100, sessionId);

	await stripe.checkout.sessions.update(sessionId, {
		metadata: {
			...session.metadata,
			fulfilled: 'true'
		}
	});

	return true;
}

export const load: PageServerLoad = async ({ locals, params, request, url }) => {
	if (!locals.user) {
		return { success: false };
	}

	const sessionId = url.searchParams.get('session_id');

	const activeOrganization = await auth.api.getFullOrganization({
		query: {
			organizationSlug: params.organizationSlug
		},
		headers: request.headers
	});

	if (!activeOrganization) {
		error(404, 'Organization not found');
	}

	if (sessionId) {
		await fulfillAddFundsCheckout(sessionId, activeOrganization.id);
		throw redirect(303, `/${params.organizationSlug}/billing`);
	}

	const { stripeCustomerId } = locals.user;

	const paymentMethods = (await stripe.customers.listPaymentMethods(stripeCustomerId)).data;
	const transactions = await getOrganizationTransactions(activeOrganization.id);

	return {
		paymentMethods,
		transactions
	};
};

export const actions = {
	addFunds: async ({ locals, request, params }) => {
		if (!locals.user) {
			return fail(401);
		}

		const activeOrganization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: params.organizationSlug
			},
			headers: request.headers
		});

		if (
			!activeOrganization ||
			!activeOrganization.members.some((member) => member.userId === locals.user!.id)
		) {
			return fail(404);
		}

		const formData = await request.formData();
		const amountCents = formData.get('amountCents')?.toString();

		if (!amountCents || isNaN(parseInt(amountCents)) || parseInt(amountCents) < 500) {
			return fail(400);
		}

		const billingUrl = `${env.ORIGIN}/${params.organizationSlug}/billing?session_id={CHECKOUT_SESSION_ID}`;

		const session = await stripe.checkout.sessions.create({
			customer: locals.user.stripeCustomerId,
			metadata: {
				organizationId: activeOrganization.id,
				amountCents: amountCents
			},
			line_items: [
				{
					price_data: {
						currency: 'usd',
						product_data: {
							name: `Add ${formatCurrency(parseInt(amountCents) / 100)} to ContainerMC balance`
						},
						unit_amount: parseInt(amountCents)
					},
					quantity: 1
				}
			],
			mode: 'payment',
			success_url: billingUrl,
			cancel_url: `${env.ORIGIN}/${params.organizationSlug}/billing`
		});

		if (!session.url) {
			return fail(500);
		}

		throw redirect(303, session.url);
	}
} satisfies Actions;
