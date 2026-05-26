import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { DescribeRegionsCommand, EC2Client } from '@aws-sdk/client-ec2';
import type { Actions } from './$types';
import { server } from '$lib/server/db/schema';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import { HARDWARE_OPTIONS } from '$lib/constants';

export const load: PageServerLoad = async ({ locals }) => {
	const regions = (await new EC2Client({}).send(new DescribeRegionsCommand({}))).Regions ?? [];
	const servers = await db.query.server.findMany({
		where: (server, { eq }) => eq(server.userId, locals.user.id)
	});

	return {
		regions,
		servers
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
	}
} satisfies Actions;
