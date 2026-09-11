import { DATABASE_URL } from "$app/env/private";
import { drizzle } from "drizzle-orm/node-postgres";

import { authRelations } from "./auth-schema";
import { relations } from "./relations";

export const db = drizzle(DATABASE_URL, {
  relations: {
    ...relations,
    ...authRelations,
  },
});
