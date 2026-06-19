import { assertCronAuth } from '$lib/server/cron-auth';
import { collectRunningServerMetrics } from '$lib/server/metrics-collector';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	assertCronAuth(request);

	const result = await collectRunningServerMetrics();
	return json(result);
};
