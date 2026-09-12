import { defineRelations } from "drizzle-orm";

import * as authSchema from "./auth-schema";
import * as schema from "./schema";

export const relations = defineRelations({ ...schema, ...authSchema }, (r) => ({
  server: {
    ownedBy: r.one.organization({
      from: r.server.organizationId,
      to: r.organization.id,
    }),
  },
}));
