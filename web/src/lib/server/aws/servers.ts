import type { Server } from '$lib/types';
import { RegisterTaskDefinitionCommand, RunTaskCommand } from '@aws-sdk/client-ecs';
import { ecs } from './client';
import { env } from '$env/dynamic/private';

export async function launchServer(server: Server) {
	const taskDef = await ecs.send(
		new RegisterTaskDefinitionCommand({
			family: `minecraft-${server.slug}`,
			taskRoleArn: env.AWS_TASK_ROLE_ARN!,
			networkMode: 'bridge',
			containerDefinitions: [
				{
					name: 'minecraft',
					image: 'itzg/minecraft-server',
					memory: server.memoryGb * 1024,
					cpu: server.cpu * 1024,
					essential: true,
					portMappings: [
						{
							containerPort: 25565,
							hostPort: 25565,
							protocol: 'tcp'
						}
					],
					environment: [
						{ name: 'EULA', value: 'TRUE' },
						{ name: 'TYPE', value: server.type },
						{ name: 'VERSION', value: server.minecraftVersion }
					],
					logConfiguration: {
						logDriver: 'awslogs',
						options: {
							'awslogs-group': env.AWS_LOG_GROUP!,
							'awslogs-region': env.AWS_REGION!,
							'awslogs-stream-prefix': server.slug
						}
					},
					mountPoints: [
						{
							sourceVolume: 'world-data',
							containerPath: '/data'
						}
					]
				}
			],
			volumes: [
				{
					name: 'world-data',
					host: { sourcePath: `/data/${server.slug}` }
				}
			]
		})
	);

	const runResult = await ecs.send(
		new RunTaskCommand({
			cluster: env.AWS_CLUSTER_ARN!,
			taskDefinition: taskDef.taskDefinition!.taskDefinitionArn!,
			count: 1,
			capacityProviderStrategy: [
				{
					capacityProvider: env.AWS_CAPACITY_PROVIDER!,
					weight: 1
				}
			]
		})
	);

	const task = runResult.tasks![0];
	const taskArn = task.taskArn!;

	return { taskArn };
}
