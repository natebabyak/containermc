/** Cron job definitions — schedules use standard 5-field cron syntax. */
export const CRON_JOBS = [
	{
		id: 'billing-monitor',
		schedule: '* * * * *'
	},
	{
		id: 'collect-metrics',
		schedule: '* * * * *'
	}
] as const;

export type CronJobId = (typeof CRON_JOBS)[number]['id'];

export function getCronJob(id: CronJobId) {
	const job = CRON_JOBS.find((entry) => entry.id === id);
	if (!job) {
		throw new Error(`Unknown cron job: ${id}`);
	}
	return job;
}

/** Minimum Bun version for `Bun.cron` (in-process scheduler). */
export const BUN_CRON_MIN_VERSION = '1.3.11';
