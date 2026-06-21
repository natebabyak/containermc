import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/** Verify Vercel cron invocation via `Authorization: Bearer <CRON_SECRET>`. */
export function verifyCronRequest(request: Request): boolean {
	const cronSecret = env.CRON_SECRET;

	if (!cronSecret) {
		return dev;
	}

	const authHeader = request.headers.get('authorization');
	return authHeader === `Bearer ${cronSecret}`;
}
