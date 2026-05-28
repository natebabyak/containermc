import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import type { Actions } from './$types';
import { server, serverSession } from '$lib/server/db/schema';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import { HARDWARE_OPTIONS } from '$lib/constants';
import { ec2 } from '$lib/server/aws/client';
import { eq } from 'drizzle-orm';
import { launchServer } from '$lib/server/aws/servers';

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
		const minecraftVersion = formData.get('minecraftVersion')?.toString();
		const type = formData.get('type')?.toString();
		const region = formData.get('region')?.toString();
		const hardware = formData.get('hardware')?.toString();

		if (!name || !minecraftVersion || !type || !region || !hardware) {
			return { success: false };
		}

		const slug = `${slugify(name)}-${nanoid(8)}`;
		const { cpu, memoryGb } = HARDWARE_OPTIONS.find(
			(hardwareOption) => hardwareOption.name === hardware
		)!;

		try {
			await db.insert(server).values({
				name,
				slug,
				minecraftVersion,
				type,
				region,
				cpu,
				memoryGb,
				userId: event.locals.user.id
			});
			return { success: true };
		} catch {
			return { success: false };
		}
	},
	startServer: async ({ request, locals }) => {
		const formData = await request.formData();
		const serverId = formData.get('serverId')?.toString();

		if (!serverId) return { success: false };

		const existingServer = await db.query.server.findFirst({
			where: (s, { eq, and }) => and(eq(s.id, serverId), eq(s.userId, locals.user.id))
		});

		if (!existingServer) return { success: false };
		if (existingServer.status === 'running' || existingServer.status === 'starting') {
			return { success: false };
		}

		try {
			await db.update(server).set({ status: 'starting' }).where(eq(server.id, serverId));

			const { taskArn } = await launchServer(existingServer);

			await db.update(server).set({ arn: taskArn }).where(eq(server.id, serverId));

			await db.insert(serverSession).values({
				region: existingServer.region,
				cpu: existingServer.cpu,
				memoryGb: existingServer.memoryGb,
				serverId: existingServer.id,
				userId: locals.user.id
			});

			return { success: true };
		} catch (e) {
			console.error(e);

			await db.update(server).set({ status: 'stopped' }).where(eq(server.id, serverId));

			return { success: false };
		}
	}
} satisfies Actions;
