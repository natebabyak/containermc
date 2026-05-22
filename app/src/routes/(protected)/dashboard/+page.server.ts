import { db } from '$lib/server/db';
import Stripe from 'stripe';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { DescribeRegionsCommand, EC2Client } from '@aws-sdk/client-ec2';

const client = new EC2Client({});

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const load: PageServerLoad = async ({ locals }) => {
	const paymentMethodsRes = await stripe.customers.listPaymentMethods(locals.user.stripeCustomerId);

	const regionsRes = await client.send(new DescribeRegionsCommand({}));

	const servers = await db.query.server.findMany({
		where: (server, { eq }) => eq(server.userId, locals.user.id)
	});

	return {
		paymentMethods: paymentMethodsRes.data,
		regions: regionsRes.Regions ?? [],
		servers
	};
};
