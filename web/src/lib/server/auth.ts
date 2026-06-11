import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';
import { organization } from 'better-auth/plugins';
import { authClient } from '$lib/auth-client';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import { organizationBalance, userSettings } from './db/schema';

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
		organization(),
		stripe({
			stripeClient,
			stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
			createCustomerOnSignUp: true,
			subscription: {
				enabled: true,
				plans: []
			}
		}),
		sveltekitCookies(getRequestEvent)
	],
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await db.transaction(async (tx) => {
						await tx.insert(userSettings).values({ userId: user.id });

						const orgName = `${user.name}'s Org`;

						const { data: org } = await authClient.organization.create({
							name: orgName,
							slug: slugify(`${orgName}-${nanoid(8)}`)
						});

						if (!org) {
							tx.rollback();
							return;
						}

						await tx.insert(organizationBalance).values({ organizationId: org.id });
					});
				}
			}
		}
	}
});
