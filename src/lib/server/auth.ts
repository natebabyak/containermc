import {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  RESEND_API_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
} from "$app/env/private";
import { getRequestEvent } from "$app/server";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { Resend } from "resend";
import Stripe from "stripe";

import * as schema from "#lib/server/db/auth-schema.ts";
import { db } from "#lib/server/db/index.ts";

const resend = new Resend(RESEND_API_KEY);

const stripeClient = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    discord: {
      clientId: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
    },
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          await resend.emails.send({
            from: "noreply@containermc.com",
            to: email,
            subject: "ContainerMC Sign-in OTP",
            text: `Your sign-in OTP is ${otp}`,
          });
        } else if (type === "email-verification") {
          await resend.emails.send({
            from: "noreply@containermc.com",
            to: email,
            subject: "ContainerMC Email Verification OTP",
            text: `Your email verification OTP is ${otp}`,
          });
        } else {
          await resend.emails.send({
            from: "noreply@containermc.com",
            to: email,
            subject: "ContainerMC Password Reset OTP",
            text: `Your password reset OTP is ${otp}`,
          });
        }
      },
    }),
    organization(),
    stripe({
      stripeClient,
      stripeWebhookSecret: STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
    }),
    sveltekitCookies(getRequestEvent),
  ],
  advanced: {
    database: {
      joins: true,
    },
  },
});
