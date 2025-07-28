#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PageflowInfrastructureStack } from '../lib/pageflow-infrastructure-stack';

const app = new cdk.App();

// Get environment name from context or use 'dev' as default
const environmentName = app.node.tryGetContext('environment') || 'dev';

// Get admin and alarm emails from context or use placeholder values
const adminEmail = app.node.tryGetContext('adminEmail') || 'admin@example.com';
const alarmEmail = app.node.tryGetContext('alarmEmail') || 'alerts@example.com';

new PageflowInfrastructureStack(app, `PageflowInfrastructureStack-${environmentName}`, {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  
  // Pass environment-specific props
  environmentName,
  adminEmail,
  alarmEmail,
  
  // Add stack description
  description: `Pageflow AI Learning Platform infrastructure for ${environmentName} environment`,
  
  // Add tags for better resource management
  tags: {
    Environment: environmentName,
    Project: 'Pageflow',
    ManagedBy: 'CDK',
  },
});