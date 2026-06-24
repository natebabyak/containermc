import { getR2PrefixSize } from '$lib/server/backups';
import { db } from '$lib/server/db';
import { minecraftServer } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { InsufficientBalanceError } from '$lib/server/billing';
import { restoreBackup } from '$lib/server/minecraft-servers';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { activeMinecraftServer } = await parent();

	let cachedR2Size: bigint | null = null;

	const backups = (
		await Promise.all(
			activeMinecraftServer.backups.map(async (backup) => {
				if (backup.sizeBytes > 0n) {
					return backup;
				}

				if (cachedR2Size === null) {
					cachedR2Size = await getR2PrefixSize(backup.s3ObjectKey);
				}

				return { ...backup, sizeBytes: cachedR2Size };
			})
		)
	).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	return { backups };
};

export const actions = {
	restoreBackup: async (event) => {
		const formData = await event.request.formData();
		const backupId = formData.get('backupId')?.toString();

		if (!backupId) {
			return fail(400, { message: 'Backup ID is required' });
		}

		const server = await db.query.minecraftServer.findFirst({
			where: eq(minecraftServer.slug, event.params.minecraftServerSlug!)
		});

		if (!server) {
			return fail(404, { message: 'Server not found' });
		}

		const organization = await auth.api.getFullOrganization({
			query: { organizationSlug: event.params.organizationSlug },
			headers: event.request.headers
		});

		if (
			!organization ||
			server.organizationId !== organization.id ||
			!organization.members.some((member) => member.userId === event.locals.user!.id)
		) {
			return fail(404, { message: 'Server not found' });
		}

		try {
			await restoreBackup(server.id, backupId);
			return { success: true };
		} catch (err) {
			console.error(err);

			if (err instanceof InsufficientBalanceError) {
				return fail(402, { message: 'Insufficient balance to start server' });
			}

			return fail(500, {
				message: err instanceof Error ? err.message : 'Failed to restore backup'
			});
		}
	}
} satisfies Actions;
