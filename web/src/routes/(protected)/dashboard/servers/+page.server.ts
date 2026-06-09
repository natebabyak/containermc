import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import type { Actions } from './$types';
import { minecraftServer } from '$lib/server/db/schema';
import { HARDWARE_OPTIONS, MINECRAFT_SERVER_TYPES, MINECRAFT_VERSION_GROUPS } from '$lib/constants';
import { ec2 } from '$lib/server/aws/client';
import { eq } from 'drizzle-orm';
import { getServerStatus, startServer, stopServer } from '$lib/server/minecraft-servers';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';

export const load: PageServerLoad = async () => {
	const regions = (await ec2.send(new DescribeRegionsCommand({}))).Regions ?? [];

	return {
		regions
	};
};

export const actions = {
	createServer: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const type = formData.get('type')?.toString();
		const minecraftVersion = formData.get('minecraftVersion')?.toString();
		const region = formData.get('region')?.toString();
		const hardware = formData.get('hardware')?.toString();

		if (!name || !type || !minecraftVersion || !region || !hardware) {
			return {
				success: false
			};
		}

		if (!MINECRAFT_SERVER_TYPES.find((t) => t.value === type)) {
			return {
				success: false
			};
		}

		if (!MINECRAFT_VERSION_GROUPS.find((g) => g.versions.find((v) => v === minecraftVersion))) {
			return {
				success: false
			};
		}

		const slug = `${slugify(name)}-${nanoid(8).toLowerCase()}`;

		const instanceType = HARDWARE_OPTIONS.find((o) => o.name === hardware)?.instanceType;
		if (!instanceType) {
			return { success: false };
		}

		try {
			await db.insert(minecraftServer).values({
				name,
				slug,
				type,
				minecraftVersion,
				region,
				instanceType,
				iconUrl: null,
				motd: null,
				instanceId: null,
				ipAddress: null,
				userId: event.locals.user.id
			});

			return {
				success: true
			};
		} catch {
			return {
				success: false
			};
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
