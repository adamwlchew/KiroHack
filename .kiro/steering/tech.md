# Technology Stack

PageFlow is built using a modern tech stack with a microservices architecture deployed on AWS.

## Frontend Technologies

- **Web**: React, TypeScript, Redux Toolkit, Styled Components
- **Mobile AR**: React Native, TypeScript, ARKit (iOS), ARCore (Android)
- **VR**: Unity, WebGL, C#

## Backend Technologies

- **API Layer**: AWS API Gateway, Lambda Authorizers
- **Core Services**: Node.js, TypeScript
- **AI Integration**: AWS Bedrock (Claude, Stable Diffusion, Amazon Titan, Cohere)
- **Database**: DynamoDB (NoSQL), PostgreSQL (relational), Redis (caching)

## Infrastructure

- **Cloud Provider**: AWS
- **Infrastructure as Code**: AWS CDK
- **Containerization**: AWS ECS with Fargate
- **Serverless**: AWS Lambda
- **Content Delivery**: Amazon CloudFront
- **DNS Management**: Amazon Route 53

## Development Tools

- **Version Control**: Git
- **Package Management**: npm/yarn
- **Testing**: Jest, React Testing Library, Playwright, Cypress
- **Linting**: ESLint, Prettier
- **CI/CD**: AWS CodePipeline, CodeBuild, CodeDeploy

## Common Commands

### Development

```bash
# Install dependencies
npm install

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
npm run cdk deploy

# Deploy specific stack
npm run cdk deploy [stack-name]

# Synthesize CloudFormation template
npm run cdk synth
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

## AWS Services Used

- **Compute**: ECS, Fargate, Lambda, App Runner
- **Storage**: DynamoDB, RDS (PostgreSQL), S3, ElastiCache (Redis)
- **Networking**: VPC, Route 53, CloudFront, API Gateway
- **Security**: IAM, Cognito, KMS, Secrets Manager, WAF, GuardDuty
- **Monitoring**: CloudWatch, X-Ray, OpenSearch, EventBridge
- **CI/CD**: CodePipeline, CodeBuild, CodeDeploy, ECR
- **AI/ML**: Bedrock