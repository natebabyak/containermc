import Stripe from 'stripe';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { formatCurrency } from '$lib/formatters';
import { fail, redirect } from '@sveltejs/kit';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { success: false };
	}

	const { stripeCustomerId } = locals.user;

	const paymentMethods = (await stripe.customers.listPaymentMethods(stripeCustomerId)).data;

	return {
		paymentMethods
	};
};

export const actions = {
	addFunds: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401);
		}

		const formData = await request.formData();
		const amountCents = formData.get('amountCents')?.toString();

		if (!amountCents || isNaN(parseInt(amountCents)) || parseInt(amountCents) < 500) {
			return fail(400);
		}

		const session = await stripe.checkout.sessions.create({
			customer: locals.user.stripeCustomerId,
			line_items: [
				{
					price_data: {
						currency: 'usd',
						product_data: {
							name: `Add ${formatCurrency(parseInt(amountCents))} to ContainerMC balance`
						},
						unit_amount: parseInt(amountCents)
					},
					quantity: 1
				}
			],
			mode: 'payment',
			success_url: `${env.ORIGIN}/dashboard/billing`,
			cancel_url: `${env.ORIGIN}/dashboard/billing`
		});

		if (!session.url) {
			return fail(500);
		}

		throw redirect(303, session.url);
	}
} satisfies Actions;
