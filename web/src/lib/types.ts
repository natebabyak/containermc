import type { server } from '$lib/server/db/schema';

export type Server = typeof server.$inferSelect;
