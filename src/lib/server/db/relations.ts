import { defineRelations } from "drizzle-orm";

import * as authSchema from "./auth-schema";
import * as schema from "./schema";

export const relations = defineRelations({ ...schema, ...authSchema }, (r) => ({
  minecraftServer: {
    ownedBy: r.one.organization({
      from: r.minecraftServer.organizationId,
      to: r.organization.id,
    }),
  },
}));
