import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';
import { userBalance, userSettings } from './db/schema';

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2026-05-27.dahlia'
});

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET
		},
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		}
	},
	plugins: [
		stripe({
			stripeClient,
			stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
			createCustomerOnSignUp: true,
			subscription: {
				enabled: true,
				plans: [
					{
						name: 'Free',
						priceId: '',
						annualDiscountPriceId: ''
					},
					{
						name: 'Supporter',
						priceId: '',
						annualDiscountPriceId: ''
					}
				]
			}
		}),
		sveltekitCookies(getRequestEvent)
	],
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await db.insert(userBalance).values({ userId: user.id });
					await db.insert(userSettings).values({ userId: user.id });
				}
			}
		}
	}
});
