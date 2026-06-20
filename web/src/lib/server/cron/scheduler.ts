import { building } from '$app/environment';
import { CRON_JOBS, BUN_CRON_MIN_VERSION } from '$lib/cron';
import { runCronJob } from './registry';

type CronJobHandle = { stop(): void };

const GLOBAL_STATE_KEY = '__containermc_cron_state__';

type CronState = {
	handles: CronJobHandle[];
};

function getState(): CronState {
	const globalState = globalThis as typeof globalThis & {
		[GLOBAL_STATE_KEY]?: CronState;
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

function logCronUnavailable() {
	console.warn(`[cron] Bun.cron requires Bun ${BUN_CRON_MIN_VERSION}+ — run with \`bun --bun run dev\``);
}

/** Register in-process cron handlers via `Bun.cron`. Call once at server startup. */
export function startCronScheduler() {
	if (building) {
		return;
	}

	const bunCron = getBunCron();
	if (!bunCron) {
		logCronUnavailable();
		return;
	}

	stopCronScheduler();
	const state = getState();

	for (const job of CRON_JOBS) {
		const handle = bunCron(job.schedule, async function () {
			const startedAt = Date.now();
			try {
				const result = await runCronJob(job.id);
				console.log(`[cron] ${job.id} ok (${Date.now() - startedAt}ms)`, result);
			} catch (error) {
				console.error(`[cron] ${job.id} failed (${Date.now() - startedAt}ms)`, error);
			}
		}) as CronJobHandle;

		state.handles.push(handle);
		console.log(`[cron] scheduled ${job.id} (${job.schedule})`);
	}
}

export function stopCronScheduler() {
	const state = getState();

	for (const handle of state.handles) {
		handle.stop();
	}

	state.handles = [];
}
