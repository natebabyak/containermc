import { GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { db } from '$lib/server/db';
import { minecraftServer, minecraftServerSnapshot } from '$lib/server/db/schema';
import { cloudwatch } from '$lib/server/aws/client';
import {
	parsePlayerCount,
	parseTps,
	runRconCommand
} from '$lib/server/instance-control';
import { eq, lt } from 'drizzle-orm';

const SNAPSHOT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

async function getCloudWatchMetric(
	serverId: string,
	metricName: string,
	instanceId: string
): Promise<number> {
	const end = new Date();
	const start = new Date(end.getTime() - 5 * 60 * 1000);

	const result = await cloudwatch.send(
		new GetMetricDataCommand({
			MetricDataQueries: [
				{
					Id: 'm1',
					MetricStat: {
						Metric: {
							Namespace: 'Minecraft/Servers',
							MetricName: metricName,
							Dimensions: [{ Name: 'ServerId', Value: serverId }]
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
	if (value !== undefined) {
		return value;
	}

	const ec2Result = await cloudwatch.send(
		new GetMetricDataCommand({
			MetricDataQueries: [
				{
					Id: 'm1',
					MetricStat: {
						Metric: {
							Namespace: 'CWAgent',
							MetricName: metricName,
							Dimensions: [{ Name: 'InstanceId', Value: instanceId }]
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

	return ec2Result.MetricDataResults?.[0]?.Values?.at(-1) ?? 0;
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
	const [cpuUsagePct, memoryUsagePct, listOutput, tpsOutput] = await Promise.all([
		getCloudWatchMetric(server.id, 'cpu_usage_active', server.instanceId),
		getCloudWatchMetric(server.id, 'mem_used_percent', server.instanceId),
		runRconCommand(server.instanceId, 'list').catch(() => ''),
		runRconCommand(server.instanceId, 'tps').catch(() => '20.0')
	]);

	return {
		players: parsePlayerCount(listOutput),
		tps: parseTps(tpsOutput),
		cpu: Number(cpuUsagePct.toFixed(2)),
		memory: Number(memoryUsagePct.toFixed(2)),
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

	const [cpuUsagePct, memoryUsagePct, listOutput, tpsOutput] = await Promise.all([
		getCloudWatchMetric(server.id, 'cpu_usage_active', server.instanceId),
		getCloudWatchMetric(server.id, 'mem_used_percent', server.instanceId),
		runRconCommand(server.instanceId, 'list').catch(() => ''),
		runRconCommand(server.instanceId, 'tps').catch(() => '20.0')
	]);

	await db.insert(minecraftServerSnapshot).values({
		minecraftServerId: server.id,
		cpuUsagePct: cpuUsagePct.toFixed(2),
		memoryUsagePct: memoryUsagePct.toFixed(2),
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
