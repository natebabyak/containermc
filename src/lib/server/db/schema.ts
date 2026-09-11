import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, bigint, pgEnum } from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";

export const minecraftServerStatus = pgEnum("minecraft_server_status", [
  "error",
  "running",
  "starting",
  "stopped",
  "stopping",
]);

export const minecraftServer = pgTable("minecraft_server", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: minecraftServerStatus("status").notNull(),
  awsRegionCode: text("aws_region_code").notNull(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  iconUrl: text("icon_url"),
  motd: text("motd"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
