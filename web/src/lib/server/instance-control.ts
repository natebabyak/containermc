import { env } from '$env/dynamic/private';
import {
	FilterLogEventsCommand,
	type FilterLogEventsCommandOutput
} from '@aws-sdk/client-cloudwatch-logs';
import {
	GetCommandInvocationCommand,
	SendCommandCommand
} from '@aws-sdk/client-ssm';
import { error, type RequestEvent } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { minecraftServer } from '$lib/server/db/schema';
import { cloudwatchLogs, ssm } from '$lib/server/aws/client';
import { eq } from 'drizzle-orm';

export type LogSource = 'server' | 'ec2';

const UNSAFE_COMMAND = /[;|`$\n]/;

export function getRconPassword() {
	return env.RCON_PASSWORD ?? 'mcpaas';
}

export function getAwsRegion() {
	return env.AWS_REGION ?? env.AWS_DEFAULT_REGION ?? 'us-east-1';
}

export function dockerLogGroup(serverId: string) {
	return `/minecraft/servers/${serverId}/docker`;
}

export function cloudInitLogGroup(serverId: string) {
	return `/minecraft/servers/${serverId}/cloud-init`;
}

export function validateRconCommand(command: string): string {
	const trimmed = command.trim();
	if (!trimmed) {
		throw error(400, 'Command is required');
	}
	if (trimmed.length > 256) {
		throw error(400, 'Command is too long');
	}
	if (UNSAFE_COMMAND.test(trimmed)) {
		throw error(400, 'Invalid characters in command');
	}
	return trimmed;
}

export async function assertServerAccess(
	event: RequestEvent,
	minecraftServerId: string,
	options: { requireRunning?: boolean } = {}
) {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized');
	}

	const server = await db.query.minecraftServer.findFirst({
		where: eq(minecraftServer.id, minecraftServerId)
	});

	if (!server) {
		throw error(404, 'Minecraft server not found');
	}

	const organization = await auth.api.getFullOrganization({
		query: { organizationId: server.organizationId },
		headers: event.request.headers
	});

	if (
		!organization ||
		!organization.members.some((member) => member.userId === event.locals.user!.id)
	) {
		throw error(404, 'Minecraft server not found');
	}

	if (options.requireRunning) {
		if (server.status !== 'running' || !server.instanceId) {
			throw error(409, 'Server is not running');
		}
	}

	return { server, organization };
}

export async function runSsmCommand(
	instanceId: string,
	commands: string[],
	timeoutSeconds = 30
): Promise<string> {
	const command = await ssm.send(
		new SendCommandCommand({
			InstanceIds: [instanceId],
			DocumentName: 'AWS-RunShellScript',
			Parameters: { commands },
			TimeoutSeconds: timeoutSeconds
		})
	);

	const commandId = command.Command?.CommandId;
	if (!commandId) {
		throw new Error('SSM did not return a command ID');
	}

	const maxAttempts = Math.ceil(timeoutSeconds / 2.5);

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
			const stderr = invocation.StandardErrorContent?.trim();
			throw new Error(stderr || `SSM command failed: ${invocation.Status}`);
		}
	}

	throw new Error('SSM command timed out');
}

export async function runRconCommand(instanceId: string, command: string): Promise<string> {
	const password = getRconPassword();
	const shellSafeCommand = command.replace(/'/g, `'\\''`);
	return runSsmCommand(instanceId, [
		`docker exec mc rcon-cli --password ${password} '${shellSafeCommand}'`
	]);
}

export function parsePlayerCount(output: string): number {
	const match = output.match(/There are (\d+) of a max/i);
	return match ? parseInt(match[1], 10) : 0;
}

export function parseTps(output: string): number {
	const match = output.match(/([\d.]+)\s*tps/i) ?? output.match(/^([\d.]+)/);
	return match ? parseFloat(match[1]) : 20;
}

async function filterCloudWatchLogs(
	logGroupName: string,
	options: { limit?: number; cursor?: string }
): Promise<FilterLogEventsCommandOutput> {
	return cloudwatchLogs.send(
		new FilterLogEventsCommand({
			logGroupName,
			limit: options.limit ?? 200,
			nextToken: options.cursor,
			startTime: Date.now() - 24 * 60 * 60 * 1000
		})
	);
}

export async function getServerLogs(
	serverId: string,
	instanceId: string,
	source: LogSource,
	options: { cursor?: string } = {}
): Promise<{ lines: string[]; cursor?: string }> {
	const logGroupName = source === 'server' ? dockerLogGroup(serverId) : cloudInitLogGroup(serverId);

	try {
		const result = await filterCloudWatchLogs(logGroupName, options);
		const lines = (result.events ?? []).map((event) => event.message ?? '').filter(Boolean);

		if (lines.length > 0) {
			return { lines, cursor: result.nextToken };
		}
	} catch {
		// Fall back to SSM when CloudWatch is unavailable or empty.
	}

	const fallbackCommand =
		source === 'server'
			? 'docker logs --tail 200 mc 2>&1'
			: 'tail -n 200 /var/log/cloud-init-output.log 2>&1';

	const output = await runSsmCommand(instanceId, [fallbackCommand], 60);
	return { lines: output.split('\n').filter(Boolean) };
}
