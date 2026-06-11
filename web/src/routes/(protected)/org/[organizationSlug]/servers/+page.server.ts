import { db } from '$lib/server/db';
import { minecraftServer } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { startServer, stopServer } from '$lib/server/minecraft-servers';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import type { Actions } from './$types';
import { auth } from '$lib/server/auth';

export const actions = {
	createServer: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const type = formData.get('type')?.toString();
		const minecraftVersion = formData.get('minecraftVersion')?.toString();
		const region = formData.get('region')?.toString();
		const instanceType = formData.get('instanceType')?.toString();

		if (!name || !type || !minecraftVersion || !region || !instanceType) {
			return {
				success: false
			};
		}

		const organization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: event.params.organizationSlug
			},
			headers: event.request.headers
		});

		if (!organization) {
			return { success: false };
		}

		try {
			await db.insert(minecraftServer).values({
				name,
				slug: `${slugify(`${name}-${nanoid(8)}`)}`,
				type,
				minecraftVersion,
				region,
				instanceType,
				iconUrl: null,
				motd: null,
				instanceId: null,
				ipAddress: null,
				organizationId: organization.id
			});

			return { success: true };
		} catch {
			return { success: false };
		}
	},
	startServer: async (event) => {
		const formData = await event.request.formData();
		const serverId = formData.get('serverId')?.toString();

		if (!serverId) {
			return {
				success: false
			};
		}

		try {
			await startServer(serverId);

			return {
				success: true
			};
		} catch {
			return {
				success: false
			};
		}
	},
	stopServer: async (event) => {
		const formData = await event.request.formData();
		const serverId = formData.get('serverId')?.toString();

		if (!serverId) {
			return {
				success: false
			};
		}

		try {
			await stopServer(serverId);

			return {
				success: true
			};
		} catch {
			return {
				success: false
			};
		}
	},
	deleteServer: async (event) => {
		const formData = await event.request.formData();
		const serverId = formData.get('serverId')?.toString();

		if (!serverId) {
			return {
				success: false
			};
		}

		try {
			await db.delete(minecraftServer).where(eq(minecraftServer.id, serverId));

			return {
				success: true
			};
		} catch {
			return {
				success: false
			};
		}
	},
	getServerStatus: async (event) => {
		const formData = await event.request.formData();
		const serverId = formData.get('serverId')?.toString();
		if (!serverId) return { success: false };

		try {
			const status = await getServerStatus(serverId);
			return { success: true, status };
		} catch {
			return { success: false };
		}
	}
} satisfies Actions;
