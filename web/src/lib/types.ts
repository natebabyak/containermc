import type { minecraftServer, minecraftServerSession } from '$lib/server/db/schema';
import type { MINECRAFT_SERVER_TYPES, MINECRAFT_VERSION_GROUPS } from './constants';

export type MinecraftServerInsert = typeof minecraftServer.$inferInsert;
export type MinecraftServerSelect = typeof minecraftServer.$inferSelect;

export type MinecraftServerType = (typeof MINECRAFT_SERVER_TYPES)[number];
export type MinecraftVersion = (typeof MINECRAFT_VERSION_GROUPS)[number]['versions'][number];

export type MinecraftServerSessionSelect = typeof minecraftServerSession.$inferSelect;
export type MinecraftServerSessionInsert = typeof minecraftServerSession.$inferInsert;
