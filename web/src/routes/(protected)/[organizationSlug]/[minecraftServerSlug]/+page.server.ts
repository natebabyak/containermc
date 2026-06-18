import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { minecraftServer } from '$lib/server/db/schema';

export const actions = {
	deleteMinecraftServer: async (event) => {
		const formData = await event.request.formData();
		const minecraftServerId = formData.get('minecraftServerId')?.toString();

		if (!minecraftServerId) {
			return fail(400, 'Minecraft server ID is missing');
		}

		try {
			await db
				.update(minecraftServer)
				.set({ status: 'stopped', deletedAt: new Date() })
				.where(eq(minecraftServer.id, minecraftServerId));

			return { success: true };
		} catch {
			return fail(500, 'Failed to delete Minecraft server');
		}
	}
} satisfies Actions;
