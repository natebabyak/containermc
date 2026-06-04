import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import {
	DescribeInstancesCommand,
	DescribeRegionsCommand,
	RunInstancesCommand,
	waitUntilInstanceRunning
} from '@aws-sdk/client-ec2';
import type { Actions } from './$types';
import { minecraftServer } from '$lib/server/db/schema';
import slugify from '@sindresorhus/slugify';
import { nanoid } from 'nanoid';
import { HARDWARE_OPTIONS } from '$lib/constants';
import { ec2, route53, ssm } from '$lib/server/aws/client';
import { eq } from 'drizzle-orm';
import { GetParameterCommand } from '@aws-sdk/client-ssm';
import { ChangeResourceRecordSetsCommand } from '@aws-sdk/client-route-53';

export const load: PageServerLoad = async () => {
	const regions = (await ec2.send(new DescribeRegionsCommand({}))).Regions ?? [];

	return {
		regions
	};
};

export const actions = {
	createServer: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString();
		const minecraftVersion = formData.get('minecraftVersion')?.toString();
		const type = formData.get('type')?.toString();
		const region = formData.get('region')?.toString();
		const hardware = formData.get('hardware')?.toString();

		if (!name || !minecraftVersion || !type || !region || !hardware) {
			return { success: false };
		}

		const slug = `${slugify(name)}-${nanoid(8)}`;

		const { cpu, memoryGb } = HARDWARE_OPTIONS.find(
			(hardwareOption) => hardwareOption.name === hardware
		)!;

		try {
			await db.insert(minecraftServer).values({
				name,
				slug,
				iconUrl: null,
				minecraftVersion,
				type,
				region,
				cpu,
				memoryGb,
				userId: event.locals.user.id
			});

			return { success: true };
		} catch {
			return { success: false };
		}
	},
	startServer: async (event) => {
		const formData = await event.request.formData();
		const serverId = formData.get('serverId')?.toString();
		if (!serverId) return { success: false };

		const server = await db.query.minecraftServer.findFirst({
			where: eq(minecraftServer.id, serverId)
		});
		if (!server) return { success: false };

		const [sgParam, subnetParam, profileParam] = await Promise.all([
			ssm.send(new GetParameterCommand({ Name: '/minecraft/security-group-id' })),
			ssm.send(new GetParameterCommand({ Name: '/minecraft/subnet-id' })),
			ssm.send(new GetParameterCommand({ Name: '/minecraft/instance-profile-arn' }))
		]);

		const securityGroupId = sgParam.Parameter!.Value!;
		const subnetId = subnetParam.Parameter!.Value!;
		const instanceProfileArn = profileParam.Parameter!.Value!;

		const amiParam = await ssm.send(
			new GetParameterCommand({
				Name: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64'
			})
		);
		const imageId = amiParam.Parameter!.Value!;

		const dockerCompose = [
			'services:',
			'  mc:',
			'    image: itzg/minecraft-server:latest',
			'    tty: true',
			'    stdin_open: true',
			'    ports:',
			'      - "25565:25565"',
			'    environment:',
			'      EULA: "TRUE"',
			`      TYPE: "${server.type}"`,
			`      VERSION: "${server.minecraftVersion}"`,
			`      MEMORY: "${server.memoryGb * 1024}M"`,
			'    volumes:',
			'      - "./data:/data"'
		].join('\n');

		const userDataScript = `#!/bin/bash
set -e
yum update -y
yum install -y docker
systemctl enable docker
systemctl start docker
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
mkdir -p /srv/minecraft && cd /srv/minecraft
cat > docker-compose.yml << 'YAML'
${dockerCompose}
YAML
docker-compose up -d`;

		const userData = Buffer.from(userDataScript).toString('base64');

		await db
			.update(minecraftServer)
			.set({ status: 'starting' })
			.where(eq(minecraftServer.id, serverId));

		const ec2Result = await ec2.send(
			new RunInstancesCommand({
				ImageId: imageId,
				InstanceType: 't4g.micro',
				MinCount: 1,
				MaxCount: 1,
				UserData: userData,
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
		if (!instanceId) {
			await db
				.update(minecraftServer)
				.set({ status: 'stopped' })
				.where(eq(minecraftServer.id, serverId));
			return { success: false };
		}

		await db
			.update(minecraftServer)
			.set({ instanceId: instanceId })
			.where(eq(minecraftServer.id, serverId));

		await waitUntilInstanceRunning(
			{
				client: ec2,
				maxWaitTime: 120
			},
			{
				InstanceIds: [instanceId]
			}
		);

		const described = await ec2.send(
			new DescribeInstancesCommand({
				InstanceIds: [instanceId]
			})
		);
		const publicIp = described.Reservations?.[0].Instances?.[0].PublicIpAddress;

		const hostedZoneParam = await ssm.send(
			new GetParameterCommand({
				Name: '/minecraft/hosted-zone-id'
			})
		);
		const hostedZoneId = hostedZoneParam.Parameter!.Value!;

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
			.set({ status: 'running' })
			.where(eq(minecraftServer.id, serverId));

		return { success: true, instanceId, publicIp };
	},
	stopServer: async (event) => {
		const formData = await event.request.formData();
		const serverId = formData.get('serverId')?.toString();

		if (!serverId) {
			return {
				success: false
			};
		}

		try {
			await db
				.update(minecraftServer)
				.set({ status: 'stopping' })
				.where(eq(minecraftServer.id, serverId));

			return {
				success: true
			};
		} catch {
			return {
				success: false
			};
		}
	}
} satisfies Actions;
