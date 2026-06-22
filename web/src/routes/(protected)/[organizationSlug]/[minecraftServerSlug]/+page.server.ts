import { getServerDashboardData } from '$lib/server/server-dashboard';
import { parseTimeRange } from '$lib/server-dashboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { activeMinecraftServer } = await parent();
	const range = parseTimeRange(url.searchParams.get('range'));

	return getServerDashboardData(activeMinecraftServer, range);
};
