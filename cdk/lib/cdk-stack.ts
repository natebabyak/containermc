import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";

export class ContainerMCStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
    });

    const instanceRole = new iam.Role(this, "InstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonEC2ContainerServiceforEC2Role",
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore",
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "CloudWatchAgentServerPolicy",
        ),
      ],
    });

    const instanceSg = new ec2.SecurityGroup(this, "InstanceSg", {
      vpc,
      description: "Minecraft EC2 instances",
    });
    instanceSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(25565),
      "Minecraft Java",
    );
    instanceSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(19132),
      "Minecraft Bedrock",
    );

    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    const asg = new autoscaling.AutoScalingGroup(this, "ASG", {
      vpc,
      mixedInstancesPolicy: {
        instancesDistribution: {
          onDemandPercentageAboveBaseCapacity: 100,
          onDemandAllocationStrategy:
            autoscaling.OnDemandAllocationStrategy.LOWEST_PRICE,
        },
        launchTemplate: new ec2.LaunchTemplate(this, "LaunchTemplate", {
          machineImage: ecs.EcsOptimizedImage.amazonLinux2(
            ecs.AmiHardwareType.ARM,
          ),
          role: instanceRole,
          securityGroup: instanceSg,
        }),
        launchTemplateOverrides: [
          {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T4G,
              ec2.InstanceSize.MICRO,
            ),
          },
          {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T4G,
              ec2.InstanceSize.SMALL,
            ),
          },
          {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T4G,
              ec2.InstanceSize.MEDIUM,
            ),
          },
        ],
      },
      minCapacity: 0,
      maxCapacity: 20,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      associatePublicIpAddress: true,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, "AsgCp", {
      autoScalingGroup: asg,
      enableManagedScaling: true,
      enableManagedTerminationProtection: false,
    });
    cluster.addAsgCapacityProvider(capacityProvider);

    const logGroup = new logs.LogGroup(this, "ServerLogs", {
      logGroupName: "/containermc/servers",
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskRole = new iam.Role(this, "TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    logGroup.grantWrite(taskRole);

    new cdk.CfnOutput(this, "ClusterArn", { value: cluster.clusterArn });
    new cdk.CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new cdk.CfnOutput(this, "VpcId", { value: vpc.vpcId });
    new cdk.CfnOutput(this, "InstanceSgId", {
      value: instanceSg.securityGroupId,
    });
    new cdk.CfnOutput(this, "LogGroupName", { value: logGroup.logGroupName });
    new cdk.CfnOutput(this, "TaskRoleArn", { value: taskRole.roleArn });
    new cdk.CfnOutput(this, "CapacityProviderName", {
      value: capacityProvider.capacityProviderName,
    });
  }
}
