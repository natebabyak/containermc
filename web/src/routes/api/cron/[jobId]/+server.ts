import { error, json } from '@sveltejs/kit';
import { isCronJobId } from '$lib/cron';
import { verifyCronRequest } from '$lib/server/cron/auth';
import { runCronJob } from '$lib/server/cron';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	if (!verifyCronRequest(request)) {
		throw error(401, 'Unauthorized');
	}

	const { jobId } = params;
	if (!isCronJobId(jobId)) {
		throw error(404, 'Unknown cron job');
	}

	const startedAt = Date.now();

	try {
		const result = await runCronJob(jobId);
		console.log(`[cron] ${jobId} ok (${Date.now() - startedAt}ms)`, result);
		return json({ ok: true, jobId, result, durationMs: Date.now() - startedAt });
	} catch (err) {
		console.error(`[cron] ${jobId} failed (${Date.now() - startedAt}ms)`, err);
		throw error(500, err instanceof Error ? err.message : 'Cron job failed');
	}
};
