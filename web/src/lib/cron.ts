/** Cron job definitions — schedules use standard 5-field cron syntax (UTC on Vercel). */
export const CRON_JOBS = [
	{
		id: 'billing-monitor',
		schedule: '* * * * *',
		path: '/api/cron/billing-monitor'
	},
	{
		id: 'collect-metrics',
		schedule: '* * * * *',
		path: '/api/cron/collect-metrics'
	}
] as const;

export type CronJobId = (typeof CRON_JOBS)[number]['id'];

export function isCronJobId(id: string): id is CronJobId {
	return CRON_JOBS.some((entry) => entry.id === id);
}

export function getCronJob(id: CronJobId) {
	const job = CRON_JOBS.find((entry) => entry.id === id);
	if (!job) {
		throw new Error(`Unknown cron job: ${id}`);
	}
	return job;
}
