import * as cdk from "aws-cdk-lib";
import { ContainerMCStack } from "../lib/cdk-stack";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.HOSTED_ZONE_ID) {
  throw new Error("HOSTED_ZONE_ID environment variable is not set");
}

const app = new cdk.App();

new ContainerMCStack(app, "ContainerMCStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
