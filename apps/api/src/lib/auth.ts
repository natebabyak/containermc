import { stripe } from "@better-auth/stripe";
import { db } from "@workspace/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { emailOTP, organization } from "better-auth/plugins";
import Stripe from "stripe";
import { sendEmail } from "./email.js";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-07-29.dahlia",
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          await sendEmail({
            from: "noreply@containermc.com",
            to: email,
            subject: "Sign-in OTP",
            html: `<p>Your OTP is: ${otp}</p>`,
          });
        } else if (type === "email-verification") {
          await sendEmail({
            from: "noreply@containermc.com",
            to: email,
            subject: "Email Verification OTP",
            html: `<p>Your OTP is: ${otp}</p>`,
          });
        } else {
          await sendEmail({
            from: "noreply@containermc.com",
            to: email,
            subject: "Reset Password OTP",
            html: `<p>Your OTP is: ${otp}</p>`,
          });
        }
      },
    }),
    organization(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
      createCustomerOnSignUp: true,
    }),
  ],
  experimental: {
    joins: true,
  },
});
