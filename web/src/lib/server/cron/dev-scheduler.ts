import { dev, building } from '$app/environment';
import { CRON_JOBS } from '$lib/cron';
import { runCronJob } from './registry';

type CronJobHandle = { stop(): void };

const GLOBAL_STATE_KEY = '__containermc_dev_cron_state__';

type DevCronState = {
	handles: CronJobHandle[];
};

function getState(): DevCronState {
	const globalState = globalThis as typeof globalThis & {
		[GLOBAL_STATE_KEY]?: DevCronState;
	};

	if (!globalState[GLOBAL_STATE_KEY]) {
		globalState[GLOBAL_STATE_KEY] = { handles: [] };
	}

	return globalState[GLOBAL_STATE_KEY];
}

function getBunCron():
	| ((schedule: string, handler: () => void | Promise<void>) => CronJobHandle)
	| undefined {
	return (globalThis as { Bun?: { cron?: typeof Bun.cron } }).Bun?.cron as
		| ((schedule: string, handler: () => void | Promise<void>) => CronJobHandle)
		| undefined;
}

async function executeCronJob(id: (typeof CRON_JOBS)[number]['id']) {
	const startedAt = Date.now();

	try {
		const result = await runCronJob(id);
		console.log(`[cron] ${id} ok (${Date.now() - startedAt}ms)`, result);
	} catch (error) {
		console.error(`[cron] ${id} failed (${Date.now() - startedAt}ms)`, error);
	}
}

/** Register in-process cron handlers via `Bun.cron` during local development. */
export function startDevCronScheduler() {
	if (building || !dev) {
		return;
	}

	const bunCron = getBunCron();
	if (!bunCron) {
		console.warn('[cron] Bun.cron unavailable — run with `bun --bun run dev` for local scheduling');
		return;
	}

	stopDevCronScheduler();
	const state = getState();

	for (const job of CRON_JOBS) {
		const handle = bunCron(job.schedule, async function () {
			await executeCronJob(job.id);
		}) as CronJobHandle;

		state.handles.push(handle);
		console.log(`[cron] scheduled ${job.id} (${job.schedule})`);
	}
}

export function stopDevCronScheduler() {
	const state = getState();

	for (const handle of state.handles) {
		handle.stop();
	}

	state.handles = [];
}
