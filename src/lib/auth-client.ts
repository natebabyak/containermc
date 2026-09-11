import { stripeClient } from "@better-auth/stripe/client";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), organizationClient(), stripeClient()],
});
