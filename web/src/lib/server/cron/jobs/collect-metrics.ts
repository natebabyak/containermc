import { collectRunningServerMetrics } from '$lib/server/metrics-collector';

export type CollectMetricsResult = Awaited<ReturnType<typeof collectRunningServerMetrics>>;

export async function runCollectMetrics(): Promise<CollectMetricsResult> {
	return collectRunningServerMetrics();
}
