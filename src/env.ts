import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  BETTER_AUTH_SECRET: {
    description: "Better Auth secret",
  },
  BETTER_AUTH_URL: {
    description: "Better Auth URL",
  },
  DATABASE_URL: {
    description: "Database URL",
  },
  DISCORD_CLIENT_ID: {
    description: "Discord OAuth client ID",
  },
  DISCORD_CLIENT_SECRET: {
    description: "Discord OAuth client secret",
  },
  GITHUB_CLIENT_ID: {
    description: "GitHub OAuth client ID",
  },
  GITHUB_CLIENT_SECRET: {
    description: "GitHub OAuth client secret",
  },
  RESEND_API_KEY: {
    description: "Resend API key",
  },
  STRIPE_SECRET_KEY: {
    description: "Stripe secret key",
  },
  STRIPE_WEBHOOK_SECRET: {
    description: "Stripe webhook secret",
  },
});
