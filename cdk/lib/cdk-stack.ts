import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class ContainerMCStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, "MinecraftSG", {
      vpc,
      description: "Minecraft server instances",
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(25565),
      "Minecraft game traffic",
    );

    const instanceRole = new iam.Role(this, "InstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore",
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "CloudWatchAgentServerPolicy",
        ),
      ],
    });

    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
        ],
        resources: ["arn:aws:logs:*:*:log-group:/minecraft/servers/*"],
      }),
    );

    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      "InstanceProfile",
      {
        roles: [instanceRole.roleName],
      },
    );

    const hostedZoneId = process.env.HOSTED_ZONE_ID!;

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: "mc.containermc.com",
      },
    );

    new ssm.StringParameter(this, "SGParam", {
      parameterName: "/minecraft/security-group-id",
      stringValue: securityGroup.securityGroupId,
    });

    new ssm.StringParameter(this, "SubnetParam", {
      parameterName: "/minecraft/subnet-id",
      stringValue: vpc.publicSubnets[0].subnetId,
    });

    new ssm.StringParameter(this, "InstanceProfileParam", {
      parameterName: "/minecraft/instance-profile-arn",
      stringValue: instanceProfile.attrArn,
    });

    new ssm.StringParameter(this, "HostedZoneParam", {
      parameterName: "/minecraft/hosted-zone-id",
      stringValue: hostedZoneId,
    });

    new cdk.CfnOutput(this, "VpcId", { value: vpc.vpcId });
    new cdk.CfnOutput(this, "SecurityGroupId", {
      value: securityGroup.securityGroupId,
    });
    new cdk.CfnOutput(this, "InstanceProfileArn", {
      value: instanceProfile.attrArn,
    });
    new cdk.CfnOutput(this, "HostedZoneId", { value: hostedZone.hostedZoneId });
  }
}
