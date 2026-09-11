import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";

export const status = pgEnum("status", ["error", "running", "starting", "stopped", "stopping"]);

export const server = pgTable("server", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: status("status").notNull(),
  awsRegionCode: text("aws_region_code").notNull(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  iconUrl: text("icon_url"),
  motd: text("motd"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mod = pgTable("mod", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
});

export const plugin = pgTable("plugin", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
});

export const serverMod = pgTable("server_mod", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  serverId: uuid("server_id")
    .notNull()
    .references(() => server.id, { onDelete: "cascade" }),
  modId: uuid("mod_id")
    .notNull()
    .references(() => mod.id, { onDelete: "cascade" }),
});
