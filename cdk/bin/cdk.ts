import * as cdk from "aws-cdk-lib";
import { ContainerMCStack } from "../lib/cdk-stack";

const app = new cdk.App();
new ContainerMCStack(app, "ContainerMC", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
