import { sql } from "drizzle-orm";
import {
  bigint,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const minecraftServerStatus = pgEnum("minecraft_server_status", [
  "error",
  "running",
  "sleeping",
  "starting",
  "stopped",
  "stopping",
]);

export const minecraftServer = pgTable("minecraft_server", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: minecraftServerStatus("status").notNull(),
  awsRegionCode: text("aws_region_code").notNull(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  iconUrl: text("icon_url"),
  motd: text("motd"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const minecraftServerBackup = pgTable("minecraft_server_backup", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  minecraftServerId: uuid("minecraft_server_id")
    .notNull()
    .references(() => minecraftServer.id, {
      onDelete: "cascade",
    }),
  objectKey: text("object_key").notNull(),
  sizeBytes: bigint("size_bytes", {
    mode: "bigint",
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const minecraftServerSession = pgTable("minecraft_server_session", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  minecraftServerId: uuid("minecraft_server_id")
    .notNull()
    .references(() => minecraftServer.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export * from "./auth-schema";
