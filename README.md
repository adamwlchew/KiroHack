# PageFlow AI Learning Platform

PageFlow is a cross-platform AI-powered learning platform that operates across web, mobile AR, and VR environments. It provides personalized, accessible, and engaging educational experiences through a microservices architecture built on AWS.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v7 or later)
- Docker
- AWS CLI configured with appropriate credentials

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up AWS credentials:
```bash
aws configure --profile pageflow
```

3. Bootstrap AWS CDK:
```bash
npm run cdk bootstrap -- --profile pageflow
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

### Deployment

```bash
# Deploy infrastructure
npm run cdk:deploy -- --profile pageflow

# Deploy specific stack
npm run cdk:deploy -- [stack-name] --profile pageflow

# Synthesize CloudFormation template
npm run cdk:synth
```

## Project Structure

- `apps/` - Frontend applications (web, mobile AR, VR)
- `services/` - Backend microservices
- `packages/` - Shared packages
- `infrastructure/` - AWS CDK infrastructure code
- `docs/` - Documentation
- `scripts/` - Build and utility scripts

## AWS Services Used

- Compute: ECS, Fargate, Lambda, App Runner
- Storage: DynamoDB, RDS (PostgreSQL), S3, ElastiCache (Redis)
- Networking: VPC, Route 53, CloudFront, API Gateway
- Security: IAM, Cognito, KMS, Secrets Manager, WAF, GuardDuty
- Monitoring: CloudWatch, X-Ray, OpenSearch, EventBridge
- CI/CD: CodePipeline, CodeBuild, CodeDeploy, ECR
- AI/ML: Bedrock