import type { Region } from '@aws-sdk/client-ec2';

export async function measurePing(region: Region) {
	const url = `https://${region.Endpoint}`;
	const start = performance.now();

	try {
		await fetch(url, { method: 'HEAD', mode: 'no-cors' });
		return performance.now() - start;
	} catch {
		return -1;
	}
}

export async function mapRegions(regions: Region[], regionGroupId: string) {
	return (
		await Promise.all(
			regions
				.filter((r) => r.RegionName?.startsWith(regionGroupId))
				.map(async (r) => ({
					...r,
					ping: await measurePing(r)
				}))
		)
	).toSorted((a, b) => a.ping - b.ping);
}

export async function mapRegionGroups(regions: Region[]) {
	return [
		{
			id: 'ap',
			name: 'Asia Pacific',
			regions: await mapRegions(regions, 'ap')
		},
		{
			id: 'ca',
			name: 'Canada',
			regions: await mapRegions(regions, 'ca')
		},
		{
			id: 'eu',
			name: 'Europe',
			regions: await mapRegions(regions, 'eu')
		},
		{
			id: 'sa',
			name: 'South America',
			regions: await mapRegions(regions, 'sa')
		},
		{
			id: 'us',
			name: 'United States',
			regions: await mapRegions(regions, 'us')
		}
	].toSorted((a, b) => a.regions[0].ping - b.regions[0].ping);
}
