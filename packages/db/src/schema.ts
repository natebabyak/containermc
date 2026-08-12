import { sql } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const minecraftServer = pgTable("minecraft_server", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const minecraftServerBackup = pgTable("minecraft_server_backup", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  minecraftServerId: uuid("server_id").notNull(),
  objectKey: text("object_key").notNull(),
});

export const minecraftServerSession = pgTable("minecraft_server_session", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  minecraftServerId: uuid("server_id").notNull(),
});
