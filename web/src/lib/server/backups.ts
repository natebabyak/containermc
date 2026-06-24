import { env } from '$env/dynamic/private';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2 } from '$lib/server/aws/client';
import { db } from '$lib/server/db';
import { minecraftServerBackup } from '$lib/server/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function getBackup(serverId: string, backupId: string) {
	return db.query.minecraftServerBackup.findFirst({
		where: and(
			eq(minecraftServerBackup.id, backupId),
			eq(minecraftServerBackup.minecraftServerId, serverId)
		)
	});
}

export async function getLatestBackup(serverId: string) {
	return db.query.minecraftServerBackup.findFirst({
		where: eq(minecraftServerBackup.minecraftServerId, serverId),
		orderBy: desc(minecraftServerBackup.createdAt)
	});
}

export async function getR2PrefixSize(prefix: string): Promise<bigint> {
	let totalBytes = 0n;
	let continuationToken: string | undefined;

	do {
		const response = await r2.send(
			new ListObjectsV2Command({
				Bucket: env.R2_BUCKET,
				Prefix: prefix,
				ContinuationToken: continuationToken
			})
		);

		for (const object of response.Contents ?? []) {
			totalBytes += BigInt(object.Size ?? 0);
		}

		continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
	} while (continuationToken);

	return totalBytes;
}
