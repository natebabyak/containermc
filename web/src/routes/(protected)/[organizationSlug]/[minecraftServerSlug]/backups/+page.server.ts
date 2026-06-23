import { getR2PrefixSize } from '$lib/server/backups';
import type { PageServerLoad } from './$types';

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
