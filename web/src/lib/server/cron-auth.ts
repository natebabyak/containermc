import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export function assertCronAuth(request: Request) {
	const authHeader = request.headers.get('authorization');
	const expected = `Bearer ${env.CRON_SECRET}`;

	if (!env.CRON_SECRET || authHeader !== expected) {
		throw error(401, 'Unauthorized');
	}
}
