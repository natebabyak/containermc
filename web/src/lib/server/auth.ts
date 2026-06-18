import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';
import { organization } from 'better-auth/plugins';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import { organizationBalance, userSettings } from './db/schema';
import { eq } from 'drizzle-orm';
import { user as userTable } from '$lib/server/db/auth.schema';

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: '2026-05-27.dahlia'
});

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	user: {
		additionalFields: {
			lastActiveOrganizationId: {
				type: 'string',
				required: true
			}
		}
	},
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
		organization({
			schema: {
				organization: {
					additionalFields: {
						isPersonal: {
							type: 'boolean',
							required: true
						}
					}
				}
			}
		}),
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
		session: {
			create: {
				before: async (session) => {
					const user = await db.query.user.findFirst({
						where: (user, { eq }) => eq(user.id, session.userId),
						columns: {
							lastActiveOrganizationId: true
						}
					});

					return {
						data: {
							...session,
							activeOrganizationId: user?.lastActiveOrganizationId
						}
					};
				}
			}
		},
		user: {
			create: {
				after: async (user) => {
					const organizationName = `${user.name}'s Org`;
					const organizationSlug = `${slugify(organizationName)}-${nanoid(8).toLowerCase()}`;

					await db.insert(userSettings).values({ userId: user.id });

					const organization = await auth.api.createOrganization({
						body: {
							name: organizationName,
							slug: organizationSlug,
							userId: user.id,
							isPersonal: true
						}
					});

					await db
						.update(userTable)
						.set({ lastActiveOrganizationId: organization.id })
						.where(eq(userTable.id, user.id));

					await db.insert(organizationBalance).values({ organizationId: organization.id });
				}
			}
		}
	}
});
