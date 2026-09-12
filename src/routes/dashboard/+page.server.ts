import { resolve } from "$app/paths";
import { error, redirect } from "@sveltejs/kit";

import { auth } from "#lib/server/auth.ts";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, request }) => {
  if (!locals.session) {
    redirect(303, resolve("/auth"));
  }

  const organizations = await auth.api.listOrganizations({
    headers: request.headers,
  });

  if (organizations.length === 0) {
    error(404);
  }

  redirect(
    303,
    resolve("/[organizationSlug]", {
      organizationSlug: organizations[0].slug,
    }),
  );
};
