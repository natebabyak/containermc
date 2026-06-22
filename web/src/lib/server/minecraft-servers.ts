import { env } from '$env/dynamic/private';
import { ec2, route53, ssm } from '$lib/server/aws/client';
import { db } from '$lib/server/db';
import {
	minecraftServer,
	minecraftServerBackup,
	minecraftServerSession
} from '$lib/server/db/schema';
import { HARDWARE_OPTIONS } from '$lib/constants';
import { and, eq, isNull } from 'drizzle-orm';
import { GetParameterCommand } from '@aws-sdk/client-ssm';
import {
	_InstanceType,
	DescribeInstancesCommand,
	RunInstancesCommand,
	TerminateInstancesCommand,
	waitUntilInstanceRunning
} from '@aws-sdk/client-ec2';
import { ChangeResourceRecordSetsCommand } from '@aws-sdk/client-route-53';
import { error } from '@sveltejs/kit';
import { computeSessionCost } from '$lib/helpers';
import {
	canAffordStart,
	chargeSession,
	InsufficientBalanceError
} from '$lib/server/billing';
import {
	cloudInitLogGroup,
	dockerLogGroup,
	getAwsRegion,
	getRconPassword,
	runSsmCommand
} from '$lib/server/instance-control';

/**
 * Starts a Minecraft server by running an EC2 instance and updating its status in the database.
 * @param serverId The ID of the server to start.
 */
export async function startServer(serverId: string) {
	const server = await db.query.minecraftServer.findFirst({
		where: eq(minecraftServer.id, serverId)
	});

	if (!server) {
		throw new Error(`Server ${serverId} not found`);
	}

	if (!(await canAffordStart(server.organizationId, server.hardwareName))) {
		throw new InsufficientBalanceError();
	}

	await db
		.update(minecraftServer)
		.set({ status: 'starting' })
		.where(eq(minecraftServer.id, serverId));

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

		const memoryGb = HARDWARE_OPTIONS.find((o) => o.name === server.hardwareName)?.memory;

		if (!memoryGb) {
			throw new Error('Invalid instance type');
		}

		const rconPassword = getRconPassword();
		const awsRegion = getAwsRegion();
		const dockerLogsGroup = dockerLogGroup(server.id);
		const cloudInitLogsGroup = cloudInitLogGroup(server.id);

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
      MEMORY: "${Math.max(512, memoryGb * 1024 - 1024)}M"
      ENABLE_RCON: "true"
      RCON_PORT: "25575"
      RCON_PASSWORD: "${rconPassword}"
    volumes:
      - "/mnt/world:/data"
    logging:
      driver: awslogs
      options:
        awslogs-region: "${awsRegion}"
        awslogs-group: "${dockerLogsGroup}"
        awslogs-stream: "mc"
        awslogs-create-group: "true"`;

		const userDataScript = `#!/bin/bash
set -e

yum update -y
yum install -y docker amazon-cloudwatch-agent
systemctl enable --now docker

curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \\
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

mkdir -p /mnt/world /srv/minecraft

AWS_ACCESS_KEY_ID=${env.R2_ACCESS_KEY_ID} \\
AWS_SECRET_ACCESS_KEY=${env.R2_SECRET_ACCESS_KEY} \\
aws s3 sync s3://${env.R2_BUCKET}/${server.slug}/ /mnt/world/ \\
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
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/cloud-init-output.log",
            "log_group_name": "${cloudInitLogsGroup}",
            "log_stream_name": "cloud-init",
            "retention_in_days": 7
          }
        ]
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
  -a fetch-config -m ec2 -s \\
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

cat > /srv/minecraft/docker-compose.yml << 'YAML'
${dockerCompose}
YAML

cd /srv/minecraft && docker-compose up -d`;

		const ec2Result = await ec2.send(
			new RunInstancesCommand({
				ImageId: imageId,
				InstanceType: HARDWARE_OPTIONS.find((o) => o.name === server.hardwareName)
					?.instanceType as _InstanceType,
				MinCount: 1,
				MaxCount: 1,
				UserData: Buffer.from(userDataScript).toString('base64'),
				SecurityGroupIds: [securityGroupId],
				SubnetId: subnetId,
				IamInstanceProfile: {
					Arn: instanceProfileArn
				},
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

		const ec2InstanceId = ec2Result.Instances?.[0].InstanceId;

		if (!ec2InstanceId) {
			throw error(500, 'EC2 Instance ID not found');
		}

		await db
			.update(minecraftServer)
			.set({ instanceId: ec2InstanceId })
			.where(eq(minecraftServer.id, serverId));

		await waitUntilInstanceRunning(
			{ client: ec2, maxWaitTime: 120 },
			{ InstanceIds: [ec2InstanceId] }
		);

		const ec2PublicIpAddress = (
			await ec2.send(
				new DescribeInstancesCommand({
					InstanceIds: [ec2InstanceId]
				})
			)
		).Reservations?.[0].Instances?.[0].PublicIpAddress;

		if (!ec2PublicIpAddress) {
			throw error(500, 'EC2 Public IP address not found');
		}

		await route53.send(
			new ChangeResourceRecordSetsCommand({
				HostedZoneId: hostedZoneId,
				ChangeBatch: {
					Changes: [
						{
							Action: 'UPSERT',
							ResourceRecordSet: {
								Name: `${server.slug}.mc.containermc.com`,
								Type: 'A',
								TTL: 60,
								ResourceRecords: [{ Value: ec2PublicIpAddress }]
							}
						}
					]
				}
			})
		);

		await db
			.update(minecraftServer)
			.set({ status: 'running', ipAddress: ec2PublicIpAddress })
			.where(eq(minecraftServer.id, serverId));

		await db.insert(minecraftServerSession).values({
			regionCode: server.regionCode,
			hardwareName: server.hardwareName,
			minecraftServerId: server.id
		});
	} catch (err) {
		await db
			.update(minecraftServer)
			.set({ status: 'error' })
			.where(eq(minecraftServer.id, serverId));

		throw err;
	}
}

export async function stopServer(serverId: string) {
	const server = await db.query.minecraftServer.findFirst({
		where: eq(minecraftServer.id, serverId)
	});
	if (!server) throw new Error(`Server ${serverId} not found`);
	if (!server.instanceId) throw new Error(`Server ${serverId} has no running instance`);
	if (!server.ipAddress) throw new Error(`Server ${serverId} has no IP address on record`);

	const activeSession = await db.query.minecraftServerSession.findFirst({
		where: and(
			eq(minecraftServerSession.minecraftServerId, serverId),
			isNull(minecraftServerSession.endedAt)
		)
	});

	await db
		.update(minecraftServer)
		.set({ status: 'stopping' })
		.where(eq(minecraftServer.id, serverId));

	const r2Endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

	try {
		const rconPassword = getRconPassword();
		await runSsmCommand(
			server.instanceId,
			[
				`docker exec mc rcon-cli --password ${rconPassword} save-off || true`,
				`docker exec mc rcon-cli --password ${rconPassword} save-all || true`,
				'sleep 3',
				`AWS_ACCESS_KEY_ID=${env.R2_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${env.R2_SECRET_ACCESS_KEY} aws s3 sync /mnt/world s3://${env.R2_BUCKET}/${server.slug}/ --endpoint-url ${r2Endpoint} --delete`,
				`docker exec mc rcon-cli --password ${rconPassword} save-on || true`
			],
			120
		);

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
								Name: `${server.slug}.mc.containermc.com`,
								Type: 'A',
								TTL: 60,
								ResourceRecords: [{ Value: server.ipAddress }]
							}
						}
					]
				}
			})
		);

		const endedAt = new Date();

		await db
			.update(minecraftServer)
			.set({ status: 'stopped', instanceId: null, ipAddress: null })
			.where(eq(minecraftServer.id, serverId));

		if (activeSession) {
			const costDollars = computeSessionCost(server.hardwareName, activeSession.startedAt, endedAt);
			const costString = costDollars.toFixed(6);

			try {
				await chargeSession(server.organizationId, activeSession.id, costDollars);

				await db
					.update(minecraftServerSession)
					.set({ endedAt, costDollars: costString })
					.where(eq(minecraftServerSession.id, activeSession.id));
			} catch (err) {
				console.error('Failed to charge session:', err);

				await db
					.update(minecraftServer)
					.set({ status: 'error' })
					.where(eq(minecraftServer.id, serverId));

				await db
					.update(minecraftServerSession)
					.set({ endedAt, costDollars: costString })
					.where(eq(minecraftServerSession.id, activeSession.id));

				throw err;
			}
		}

		await db.insert(minecraftServerBackup).values({
			s3ObjectKey: `${server.slug}/`,
			sizeBytes: BigInt(0),
			minecraftServerId: server.id
		});
	} catch (err) {
		await db
			.update(minecraftServer)
			.set({ status: 'error' })
			.where(eq(minecraftServer.id, serverId));

		throw err;
	}
}
