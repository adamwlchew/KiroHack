# Pageflow Infrastructure

This project contains the AWS CDK infrastructure code for the Pageflow AI Learning Platform.

## Architecture

The infrastructure is organized into the following stacks:

1. **Network Stack**: VPC, subnets, Route 53, CloudFront, WAF
2. **Storage Stack**: DynamoDB tables, RDS PostgreSQL, S3 buckets, ElastiCache Redis
3. **Compute Stack**: ECS Fargate, Lambda functions, API Gateway, Amplify
4. **Monitoring Stack**: CloudWatch, X-Ray, OpenSearch, EventBridge
5. **CI/CD Stack**: CodePipeline, CodeBuild, CodeDeploy, ECR, CodeArtifact
6. **Security Stack**: IAM, Cognito, KMS, Secrets Manager, GuardDuty

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK installed globally (`npm install -g aws-cdk`)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Bootstrap your AWS environment (if not already done):

```bash
cdk bootstrap
```

## Deployment

### Deploy to Development Environment

```bash
cdk deploy --context environment=dev --context adminEmail=admin@example.com --context alarmEmail=alerts@example.com
```

### Deploy to Staging Environment

```bash
cdk deploy --context environment=staging --context adminEmail=admin@example.com --context alarmEmail=alerts@example.com
```

### Deploy to Production Environment

```bash
cdk deploy --context environment=prod --context adminEmail=admin@example.com --context alarmEmail=alerts@example.com
```

### Deploy Individual Stacks

You can deploy individual stacks by specifying the stack name:

```bash
cdk deploy PageflowInfrastructureStack-dev/NetworkStack
```

## Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk destroy`     destroy the deployed stack

## Configuration

The infrastructure can be configured using CDK context variables:

- `environment`: The deployment environment (dev, staging, prod)
- `adminEmail`: Email address for the admin user
- `alarmEmail`: Email address for receiving alarms and notifications

## Security

- All sensitive information is stored in AWS Secrets Manager
- All data is encrypted at rest and in transit
- IAM roles follow the principle of least privilege
- GuardDuty is enabled for threat detection
- WAF is configured to protect web applications

## Monitoring

- CloudWatch dashboards are created for monitoring all resources
- Alarms are configured for critical metrics
- Logs are centralized in CloudWatch Logs
- OpenSearch is used for log analysis

## CI/CD

- CodePipeline is used for continuous delivery
- CodeBuild is used for building and testing code
- CodeDeploy is used for automated deployments
- ECR is used for container image registry
- CodeArtifact is used for artifact management

## Cost Optimization

- Resources are sized appropriately for each environment
- Auto-scaling is configured to match demand
- Reserved instances can be used for predictable workloads
- Multi-AZ deployments are used selectively based on environment