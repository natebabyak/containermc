import {
	getOrganizationDashboardData
} from '$lib/server/organization-dashboard';
import { parseTimeRange } from '$lib/organization-dashboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { activeOrganization } = await parent();
	const range = parseTimeRange(url.searchParams.get('range'));

	return getOrganizationDashboardData(activeOrganization.id, range);
};
