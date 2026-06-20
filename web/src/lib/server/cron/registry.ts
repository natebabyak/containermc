import type { CronJobId } from '$lib/cron';
import { runBillingMonitor } from './jobs/billing-monitor';
import { runCollectMetrics } from './jobs/collect-metrics';

export type CronJobRunner = () => Promise<unknown>;

const runners: Record<CronJobId, CronJobRunner> = {
	'billing-monitor': runBillingMonitor,
	'collect-metrics': runCollectMetrics
};

export function getCronRunner(id: CronJobId): CronJobRunner {
	const runner = runners[id];
	if (!runner) {
		throw new Error(`No runner registered for cron job: ${id}`);
	}
	return runner;
}

export async function runCronJob(id: CronJobId): Promise<unknown> {
	return getCronRunner(id)();
}

export async function runAllCronJobs(): Promise<Record<CronJobId, unknown>> {
	const results = {} as Record<CronJobId, unknown>;

	for (const id of Object.keys(runners) as CronJobId[]) {
		results[id] = await runCronJob(id);
	}

	return results;
}
