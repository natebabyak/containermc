import type { minecraftServer } from '$lib/server/db/schema';
import type { MINECRAFT_SERVER_TYPES, MINECRAFT_VERSION_GROUPS } from './constants';

export type Server = typeof minecraftServer.$inferSelect;

export type MinecraftServerType = (typeof MINECRAFT_SERVER_TYPES)[number];
export type MinecraftVersion = (typeof MINECRAFT_VERSION_GROUPS)[number]['versions'][number];
