import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import * as authSchema from "./auth-schema";

export const server = pgTable("server", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  organizationId: text("organization_id")
    .notNull()
    .references(() => authSchema.organization.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
