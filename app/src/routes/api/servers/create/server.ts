import { db } from '$lib/server/db';
import { server } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {  
  const data = await request.json() as typeof server.$inferInsert;

  const newServer = await db.insert(server).values(data).returning()

	return new Response('Server created successfully', { status: 200 });
};
