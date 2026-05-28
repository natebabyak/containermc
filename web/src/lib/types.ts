import type { server } from './server/db/schema';

export type Server = typeof server.$inferSelect;
