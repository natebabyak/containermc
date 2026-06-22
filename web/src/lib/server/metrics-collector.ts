import { GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { db } from '$lib/server/db';
import { minecraftServer, minecraftServerSnapshot } from '$lib/server/db/schema';
import { cloudwatch } from '$lib/server/aws/client';
import {
	getHostMetricsViaSsm,
	parsePlayerCount,
	parseTps,
	runRconCommand
} from '$lib/server/instance-control';
import { eq, lt } from 'drizzle-orm';

const SNAPSHOT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const METRIC_LOOKBACK_MS = 15 * 60 * 1000;

async function queryCloudWatchMetric(
	namespace: string,
	metricName: string,
	dimensions: { Name: string; Value: string }[]
): Promise<number | null> {
	const end = new Date();
	const start = new Date(end.getTime() - METRIC_LOOKBACK_MS);

	const result = await cloudwatch.send(
		new GetMetricDataCommand({
			MetricDataQueries: [
				{
					Id: 'm1',
					MetricStat: {
						Metric: {
							Namespace: namespace,
							MetricName: metricName,
							Dimensions: dimensions
						},
						Period: 60,
						Stat: 'Average'
					},
					ReturnData: true
				}
			],
			StartTime: start,
			EndTime: end
		})
	);

	const value = result.MetricDataResults?.[0]?.Values?.at(-1);
	return value === undefined ? null : value;
}

async function getCloudWatchMetric(
	serverId: string,
	metricName: string,
	instanceId: string
): Promise<number | null> {
	const customMetric = await queryCloudWatchMetric('Minecraft/Servers', metricName, [
		{ Name: 'ServerId', Value: serverId }
	]);
	if (customMetric !== null) {
		return customMetric;
	}

	const agentMetric = await queryCloudWatchMetric('CWAgent', metricName, [
		{ Name: 'InstanceId', Value: instanceId }
	]);
	if (agentMetric !== null) {
		return agentMetric;
	}

	if (metricName === 'cpu_usage_active') {
		return queryCloudWatchMetric('AWS/EC2', 'CPUUtilization', [
			{ Name: 'InstanceId', Value: instanceId }
		]);
	}

	return null;
}

async function getCpuMemoryMetrics(
	serverId: string,
	instanceId: string
): Promise<{ cpu: number; memory: number }> {
	const [cloudCpu, cloudMemory] = await Promise.all([
		getCloudWatchMetric(serverId, 'cpu_usage_active', instanceId),
		getCloudWatchMetric(serverId, 'mem_used_percent', instanceId)
	]);

	if (cloudCpu !== null && cloudMemory !== null) {
		return {
			cpu: Number(cloudCpu.toFixed(2)),
			memory: Number(cloudMemory.toFixed(2))
		};
	}

	return getHostMetricsViaSsm(instanceId);
}

export type LiveMetrics = {
	players: number;
	tps: number;
	cpu: number;
	memory: number;
	collectedAt: string;
};

export async function fetchLiveMetrics(server: {
	id: string;
	instanceId: string;
}): Promise<LiveMetrics> {
	const [{ cpu, memory }, listOutput, tpsOutput] = await Promise.all([
		getCpuMemoryMetrics(server.id, server.instanceId),
		runRconCommand(server.instanceId, 'list').catch(() => ''),
		runRconCommand(server.instanceId, 'tps').catch(() => '20.0')
	]);

	return {
		players: parsePlayerCount(listOutput),
		tps: parseTps(tpsOutput),
		cpu,
		memory,
		collectedAt: new Date().toISOString()
	};
}

async function collectServerMetrics(server: {
	id: string;
	instanceId: string | null;
}): Promise<void> {
	if (!server.instanceId) {
		return;
	}

	const [{ cpu, memory }, listOutput, tpsOutput] = await Promise.all([
		getCpuMemoryMetrics(server.id, server.instanceId),
		runRconCommand(server.instanceId, 'list').catch(() => ''),
		runRconCommand(server.instanceId, 'tps').catch(() => '20.0')
	]);

	await db.insert(minecraftServerSnapshot).values({
		minecraftServerId: server.id,
		cpuUsagePct: cpu.toFixed(2),
		memoryUsagePct: memory.toFixed(2),
		numPlayers: parsePlayerCount(listOutput),
		tps: parseTps(tpsOutput).toFixed(2)
	});
}

async function pruneOldSnapshots() {
	const cutoff = new Date(Date.now() - SNAPSHOT_RETENTION_MS);
	await db.delete(minecraftServerSnapshot).where(lt(minecraftServerSnapshot.createdAt, cutoff));
}

export async function collectRunningServerMetrics(): Promise<{
	collected: string[];
	errors: { serverId: string; message: string }[];
}> {
	const runningServers = await db.query.minecraftServer.findMany({
		where: eq(minecraftServer.status, 'running'),
		columns: {
			id: true,
			instanceId: true
		}
	});

	const collected: string[] = [];
	const errors: { serverId: string; message: string }[] = [];

	for (const server of runningServers) {
		try {
			await collectServerMetrics(server);
			collected.push(server.id);
		} catch (err) {
			errors.push({
				serverId: server.id,
				message: err instanceof Error ? err.message : 'Unknown error'
			});
		}
	}

	await pruneOldSnapshots();

	return { collected, errors };
}
