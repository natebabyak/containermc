import { error } from "@sveltejs/kit";

import { auth } from "#lib/server/auth.js";
import { db } from "#lib/server/db/index.js";

export const load = async ({ params, request }) => {
  const { organizationSlug } = params;

  const organization = await auth.api.getOrganization({
    query: {
      organizationSlug,
    },
    headers: request.headers,
  });

  if (!organization) {
    error(404, "Organization not found");
  }

  const servers = await db.query.server.findMany({
    where: {
      organizationId: organization.id,
    },
  });

  return {
    servers,
  };
};
