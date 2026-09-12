import { resolve } from "$app/paths";
import { redirect } from "@sveltejs/kit";

import { auth } from "#lib/server/auth.ts";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params, request }) => {
  if (!locals.user) {
    redirect(303, resolve("/auth"));
  }

  const organizations = await auth.api.listOrganizations({
    headers: request.headers,
  });

  const organization = organizations.find(({ slug }) => slug === params.organizationSlug);

  if (!organization) {
    redirect(303, resolve("/"));
  }
};
