import Stripe from 'stripe';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals }) => {
	const stripe = new Stripe(env.STRIPE_SECRET_KEY);

	const paymentMethods = (await stripe.customers.listPaymentMethods(locals.user.stripeCustomerId))
		.data;

	return {
		paymentMethods
	};
};
