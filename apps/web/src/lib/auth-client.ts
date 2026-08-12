import { stripeClient } from "@better-auth/stripe/client";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  plugins: [emailOTPClient(), organizationClient(), stripeClient()],
});
