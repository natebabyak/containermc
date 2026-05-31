import type { minecraftServer } from '$lib/server/db/schema';

export type Server = typeof minecraftServer.$inferSelect;
