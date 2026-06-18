import { db } from '$lib/server/db';
import { minecraftServer } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { startServer, stopServer } from '$lib/server/minecraft-servers';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import type { Actions } from './$types';
import { auth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

export const actions = {
	createMinecraftServer: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const regionCode = formData.get('regionCode')?.toString();
		const hardwareName = formData.get('hardwareName')?.toString();

		if (!name || !regionCode || !hardwareName) {
			return fail(400, 'Invalid form data');
		}

		const organization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: event.params.organizationSlug
			},
			headers: event.request.headers
		});

		if (!organization) {
			return fail(404, 'Organization not found');
		}

		try {
			await db.insert(minecraftServer).values({
				name,
				slug: `${slugify(name)}-${nanoid(8).toLowerCase()}`,
				type: 'VANILLA',
				minecraftVersion: 'LATEST',
				regionCode,
				hardwareName,
				iconUrl: null,
				motd: null,
				instanceId: null,
				ipAddress: null,
				organizationId: organization.id
			});

			return { success: true };
		} catch {
			return fail(500, 'Failed to create Minecraft server');
		}
	},
	startMinecraftServer: async (event) => {
		const formData = await event.request.formData();
		const minecraftServerId = formData.get('minecraftServerId')?.toString();

		if (!minecraftServerId) {
			return fail(400, 'Minecraft server ID is missing');
		}

		const existingMinecraftServer = await db.query.minecraftServer.findFirst({
			where: eq(minecraftServer.id, minecraftServerId)
		});

		if (!existingMinecraftServer) {
			return fail(404, 'Minecraft server not found');
		}

		const activeOrganization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: event.params.organizationSlug
			},
			headers: event.request.headers
		});

		if (
			!activeOrganization ||
			existingMinecraftServer.organizationId !== activeOrganization.id ||
			!activeOrganization.members.some((member) => member.userId === event.locals.user.id)
		) {
			return fail(404, 'Minecraft server not found');
		}

		try {
			await startServer(existingMinecraftServer.id);

			return { success: true };
		} catch (err) {
			console.error(err);
			return { success: false };
		}
	},
	stopMinecraftServer: async (event) => {
		const formData = await event.request.formData();
		const minecraftServerId = formData.get('minecraftServerId')?.toString();

		if (!minecraftServerId) {
			return fail(400, 'Minecraft server ID is missing');
		}

		const existingMinecraftServer = await db.query.minecraftServer.findFirst({
			where: eq(minecraftServer.id, minecraftServerId)
		});

		if (!existingMinecraftServer) {
			return fail(404, 'Minecraft server not found');
		}

		const activeOrganization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: event.params.organizationSlug
			},
			headers: event.request.headers
		});

		if (
			!activeOrganization ||
			existingMinecraftServer.organizationId !== activeOrganization.id ||
			!activeOrganization.members.some((member) => member.userId === event.locals.user.id)
		) {
			return fail(404, 'Minecraft server not found');
		}

		try {
			await stopServer(minecraftServerId);

			return { success: true };
		} catch {
			return fail(500, 'Failed to stop Minecraft server');
		}
	}
} satisfies Actions;
