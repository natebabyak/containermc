import { env } from '$env/dynamic/private';
import { ec2, route53, ssm } from '$lib/server/aws/client';
import { db } from '$lib/server/db';
import { minecraftServer } from '$lib/server/db/schema';
import { HARDWARE_OPTIONS } from '$lib/constants';
import type { Server } from '$lib/types';
import { eq } from 'drizzle-orm';
import {
	GetParameterCommand,
	SendCommandCommand,
	GetCommandInvocationCommand
} from '@aws-sdk/client-ssm';
import {
	DescribeInstancesCommand,
	RunInstancesCommand,
	TerminateInstancesCommand,
	waitUntilInstanceRunning
} from '@aws-sdk/client-ec2';
import { ChangeResourceRecordSetsCommand } from '@aws-sdk/client-route-53';

function getInstanceType(server: Server) {
	for (const o of HARDWARE_OPTIONS) {
		if (o.cpu === server.cpu && o.memoryGb === server.memoryGb) {
			return o.instanceType;
		}
	}

	throw new Error('Invalid server configuration');
}

async function setStatus(
	serverId: string,
	status: typeof minecraftServer.$inferSelect.status
): Promise<void> {
	await db.update(minecraftServer).set({ status }).where(eq(minecraftServer.id, serverId));
}

export async function startServer(serverId: string): Promise<void> {
	const server = await db.query.minecraftServer.findFirst({
		where: eq(minecraftServer.id, serverId)
	});
	if (!server) throw new Error(`Server ${serverId} not found`);

	await setStatus(serverId, 'starting');

	try {
		const [sgParam, subnetParam, profileParam, amiParam, hostedZoneParam] = await Promise.all([
			ssm.send(new GetParameterCommand({ Name: '/minecraft/security-group-id' })),
			ssm.send(new GetParameterCommand({ Name: '/minecraft/subnet-id' })),
			ssm.send(new GetParameterCommand({ Name: '/minecraft/instance-profile-arn' })),
			ssm.send(
				new GetParameterCommand({
					Name: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64'
				})
			),
			ssm.send(new GetParameterCommand({ Name: '/minecraft/hosted-zone-id' }))
		]);

		const securityGroupId = sgParam.Parameter?.Value;
		const subnetId = subnetParam.Parameter?.Value;
		const instanceProfileArn = profileParam.Parameter?.Value;
		const imageId = amiParam.Parameter?.Value;
		const hostedZoneId = hostedZoneParam.Parameter?.Value;

		if (!securityGroupId || !subnetId || !instanceProfileArn || !imageId || !hostedZoneId) {
			throw new Error('One or more required SSM parameters are missing');
		}

		const r2Endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

		const dockerCompose = `services:
  mc:
    container_name: mc
    image: itzg/minecraft-server:latest
    tty: true
    stdin_open: true
    ports:
      - "25565:25565"
    environment:
      EULA: "TRUE"
      TYPE: "${server.type}"
      VERSION: "${server.minecraftVersion}"
      MEMORY: "${Math.max(512, server.memoryGb * 1024 - 1024)}M"
      ENABLE_RCON: "true"
      RCON_PORT: "25575"
      RCON_PASSWORD: "mcpaas"
    volumes:
      - "/mnt/world:/data"`;

		const userDataScript = `#!/bin/bash
set -e

yum update -y
yum install -y docker amazon-cloudwatch-agent
systemctl enable --now docker

curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

mkdir -p /mnt/world /srv/minecraft

AWS_ACCESS_KEY_ID=${env.R2_ACCESS_KEY_ID} \
AWS_SECRET_ACCESS_KEY=${env.R2_SECRET_ACCESS_KEY} \
aws s3 sync s3://${env.R2_BUCKET}/${server.slug}/ /mnt/world/ \
  --endpoint-url ${r2Endpoint} || true

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "Minecraft/Servers",
    "append_dimensions": { "ServerId": "${server.id}" },
    "metrics_collected": {
      "cpu": { "measurement": ["cpu_usage_active"], "metrics_collection_interval": 30 },
      "mem": { "measurement": ["mem_used_percent"], "metrics_collection_interval": 30 }
    }
  }
}
EOF
systemctl start amazon-cloudwatch-agent

cat > /srv/minecraft/docker-compose.yml << 'YAML'
${dockerCompose}
YAML

cd /srv/minecraft && docker-compose up -d`;

		const ec2Result = await ec2.send(
			new RunInstancesCommand({
				ImageId: imageId,
				InstanceType: getInstanceType(server),
				MinCount: 1,
				MaxCount: 1,
				UserData: Buffer.from(userDataScript).toString('base64'),
				SecurityGroupIds: [securityGroupId],
				SubnetId: subnetId,
				IamInstanceProfile: { Arn: instanceProfileArn },
				TagSpecifications: [
					{
						ResourceType: 'instance',
						Tags: [
							{ Key: 'Name', Value: server.name },
							{ Key: 'ServerId', Value: server.id },
							{ Key: 'ManagedBy', Value: 'minecraft-paas' }
						]
					}
				]
			})
		);

		const instanceId = ec2Result.Instances?.[0].InstanceId;
		if (!instanceId) throw new Error('EC2 did not return an instance ID');

		await db.update(minecraftServer).set({ instanceId }).where(eq(minecraftServer.id, serverId));

		await waitUntilInstanceRunning(
			{ client: ec2, maxWaitTime: 120 },
			{ InstanceIds: [instanceId] }
		);

		const described = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
		const publicIp = described.Reservations?.[0].Instances?.[0].PublicIpAddress;
		if (!publicIp) throw new Error(`Instance ${instanceId} has no public IP`);

		await route53.send(
			new ChangeResourceRecordSetsCommand({
				HostedZoneId: hostedZoneId,
				ChangeBatch: {
					Changes: [
						{
							Action: 'UPSERT',
							ResourceRecordSet: {
								Name: `${server.slug}.containermc.com`,
								Type: 'A',
								TTL: 60,
								ResourceRecords: [{ Value: publicIp }]
							}
						}
					]
				}
			})
		);

		await db
			.update(minecraftServer)
			.set({ status: 'running', ipAddress: publicIp })
			.where(eq(minecraftServer.id, serverId));
	} catch (err) {
		await setStatus(serverId, 'error');
		throw err;
	}
}

export async function stopServer(serverId: string): Promise<void> {
	const server = await db.query.minecraftServer.findFirst({
		where: eq(minecraftServer.id, serverId)
	});
	if (!server) throw new Error(`Server ${serverId} not found`);
	if (!server.instanceId) throw new Error(`Server ${serverId} has no running instance`);
	if (!server.ipAddress) throw new Error(`Server ${serverId} has no IP address on record`);

	await setStatus(serverId, 'stopping');

	const r2Endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

	try {
		const syncCommand = await ssm.send(
			new SendCommandCommand({
				InstanceIds: [server.instanceId],
				DocumentName: 'AWS-RunShellScript',
				Parameters: {
					commands: [
						'docker exec mc rcon-cli --password mcpaas save-off || true',
						'docker exec mc rcon-cli --password mcpaas save-all || true',
						'sleep 3',
						`AWS_ACCESS_KEY_ID=${env.R2_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${env.R2_SECRET_ACCESS_KEY} aws s3 sync /mnt/world s3://${env.R2_BUCKET}/${server.slug}/ --endpoint-url ${r2Endpoint} --delete`,
						'docker exec mc rcon-cli --password mcpaas save-on || true'
					]
				},
				TimeoutSeconds: 120
			})
		);

		const commandId = syncCommand.Command?.CommandId;
		if (!commandId) throw new Error('SSM did not return a command ID for world sync');

		for (let attempts = 0; attempts < 24; attempts++) {
			await new Promise((resolve) => setTimeout(resolve, 5000));
			const invocation = await ssm.send(
				new GetCommandInvocationCommand({
					CommandId: commandId,
					InstanceId: server.instanceId
				})
			);
			if (invocation.Status === 'Success') break;
			if (['Failed', 'Cancelled', 'TimedOut'].includes(invocation.Status ?? '')) {
				throw new Error(`World sync failed with SSM status: ${invocation.Status}`);
			}
		}

		await ec2.send(new TerminateInstancesCommand({ InstanceIds: [server.instanceId] }));

		const hostedZoneParam = await ssm.send(
			new GetParameterCommand({ Name: '/minecraft/hosted-zone-id' })
		);
		const hostedZoneId = hostedZoneParam.Parameter?.Value;
		if (!hostedZoneId) throw new Error('Hosted zone ID SSM parameter is missing');

		await route53.send(
			new ChangeResourceRecordSetsCommand({
				HostedZoneId: hostedZoneId,
				ChangeBatch: {
					Changes: [
						{
							Action: 'DELETE',
							ResourceRecordSet: {
								Name: `${server.slug}.containermc.com`,
								Type: 'A',
								TTL: 60,
								ResourceRecords: [{ Value: server.ipAddress }]
							}
						}
					]
				}
			})
		);

		await db
			.update(minecraftServer)
			.set({ status: 'stopped', instanceId: null, ipAddress: null })
			.where(eq(minecraftServer.id, serverId));
	} catch (err) {
		await setStatus(serverId, 'error');
		throw err;
	}
}
