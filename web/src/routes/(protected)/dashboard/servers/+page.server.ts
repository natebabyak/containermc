import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import type { Actions } from './$types';
import { server } from '$lib/server/db/schema';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import { HARDWARE_OPTIONS } from '$lib/constants';
import { ec2 } from '$lib/server/aws/client';

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
	}
} satisfies Actions;
