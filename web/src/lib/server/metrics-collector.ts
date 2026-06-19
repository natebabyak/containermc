import {
	GetCommandInvocationCommand,
	SendCommandCommand
} from '@aws-sdk/client-ssm';
import { GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { db } from '$lib/server/db';
import { minecraftServer, minecraftServerSnapshot } from '$lib/server/db/schema';
import { cloudwatch, ssm } from '$lib/server/aws/client';
import { eq } from 'drizzle-orm';

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

	// Fallback: EC2 namespace if CloudWatch agent uses host metrics
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

async function runSsmCommand(instanceId: string, commands: string[]): Promise<string> {
	const command = await ssm.send(
		new SendCommandCommand({
			InstanceIds: [instanceId],
			DocumentName: 'AWS-RunShellScript',
			Parameters: { commands },
			TimeoutSeconds: 30
		})
	);

	const commandId = command.Command?.CommandId;
	if (!commandId) {
		throw new Error('SSM did not return a command ID');
	}

	for (let attempt = 0; attempt < 12; attempt++) {
		await new Promise((resolve) => setTimeout(resolve, 2500));

		const invocation = await ssm.send(
			new GetCommandInvocationCommand({
				CommandId: commandId,
				InstanceId: instanceId
			})
		);

		if (invocation.Status === 'Success') {
			return invocation.StandardOutputContent ?? '';
		}

		if (['Failed', 'Cancelled', 'TimedOut'].includes(invocation.Status ?? '')) {
			throw new Error(`SSM command failed: ${invocation.Status}`);
		}
	}

	throw new Error('SSM command timed out');
}

function parsePlayerCount(output: string): number {
	const match = output.match(/There are (\d+) of a max/i);
	return match ? parseInt(match[1], 10) : 0;
}

function parseTps(output: string): number {
	const match = output.match(/([\d.]+)\s*tps/i) ?? output.match(/^([\d.]+)/);
	return match ? parseFloat(match[1]) : 20;
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
		runSsmCommand(server.instanceId, ['docker exec mc rcon-cli --password mcpaas list']).catch(
			() => ''
		),
		runSsmCommand(server.instanceId, ['docker exec mc rcon-cli --password mcpaas tps']).catch(
			() => '20.0'
		)
	]);

	await db.insert(minecraftServerSnapshot).values({
		minecraftServerId: server.id,
		cpuUsagePct: cpuUsagePct.toFixed(2),
		memoryUsagePct: memoryUsagePct.toFixed(2),
		numPlayers: parsePlayerCount(listOutput),
		tps: parseTps(tpsOutput).toFixed(2)
	});
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

	return { collected, errors };
}
