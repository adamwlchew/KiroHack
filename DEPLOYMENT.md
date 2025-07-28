# PageFlow Deployment Guide

This guide will walk you through deploying the PageFlow AI Learning Platform to AWS.

## Prerequisites

### Required Software
- **Node.js** (v18 or later)
- **npm** (v9 or later)
- **Docker** (v20 or later)
- **AWS CLI** (v2 or later)
- **Git**

### AWS Account Setup
1. **Create an AWS Account** if you don't have one
2. **Create an IAM User** with appropriate permissions
3. **Configure AWS CLI** with your credentials

## Step 1: Environment Setup

### 1.1 Clone the Repository
```bash
git clone <repository-url>
cd KiroHack1
```

### 1.2 Install Dependencies
```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 1.3 Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Key configuration items:**
- `AWS_REGION`: Your preferred AWS region (e.g., `us-east-1`)
- `AWS_PROFILE`: Your AWS CLI profile name
- `ENVIRONMENT`: Deployment environment (`dev`, `staging`, `prod`)

## Step 2: AWS Credentials Setup

### 2.1 Configure AWS CLI
```bash
aws configure --profile pageflow
```

You'll need to provide:
- **AWS Access Key ID**
- **AWS Secret Access Key**
- **Default region** (e.g., `us-east-1`)
- **Default output format** (`json`)

### 2.2 Verify AWS Access
```bash
aws sts get-caller-identity --profile pageflow
```

This should return your AWS account information.

## Step 3: Infrastructure Deployment

### 3.1 Bootstrap CDK (First Time Only)
```bash
cd pageflow-infrastructure
npm install
npm run build
npx cdk bootstrap --profile pageflow
cd ..
```

### 3.2 Deploy Infrastructure
```bash
# Deploy all infrastructure
npm run deploy:infrastructure

# Or use the automated deployment script
npm run deploy
```

This will create:
- **VPC** with public/private subnets
- **ECS Cluster** for running services
- **ECR Repositories** for Docker images
- **API Gateway** for API endpoints
- **RDS Database** (PostgreSQL)
- **DynamoDB Tables**
- **CloudFront Distribution**
- **Cognito User Pool**
- **Monitoring & Logging**

## Step 4: Service Deployment

### 4.1 Build and Push Docker Images
The deployment script will automatically:
1. Build Docker images for all services
2. Push images to ECR
3. Deploy services to ECS

### 4.2 Manual Service Deployment (if needed)
```bash
# Build specific service
cd services/assessment-service
npm run build
docker build -t assessment-service .

# Tag and push to ECR
docker tag assessment-service:latest $ECR_URL/assessment-service:latest
docker push $ECR_URL/assessment-service:latest
```

## Step 5: Web Application Deployment

### 5.1 Amplify Setup
The infrastructure creates an Amplify app. To deploy:

1. **Connect your Git repository** to Amplify
2. **Push to main branch** to trigger deployment
3. **Configure build settings** if needed

### 5.2 Manual Web Deployment
```bash
cd apps/web
npm run build
# Deploy to your preferred hosting service
```

## Step 6: Verification

### 6.1 Check Infrastructure
```bash
# View CloudFormation stacks
aws cloudformation list-stacks --profile pageflow

# Check ECS services
aws ecs list-services --cluster pageflow-cluster --profile pageflow
```

### 6.2 Test Services
```bash
# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name PageflowInfrastructureStack-dev \
  --profile pageflow \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Test health endpoints
curl $API_URL/user-service/health
curl $API_URL/assessment-service/health
curl $API_URL/bedrock-service/health
```

### 6.3 Check Web Application
- Visit your Amplify app URL
- Verify authentication works
- Test basic functionality

## Step 7: Configuration

### 7.1 Database Setup
```bash
# Connect to RDS and run migrations
psql $DATABASE_URL -f migrations/init.sql
```

### 7.2 Cognito Configuration
1. **Create User Pool Groups** (Students, Teachers, Admins)
2. **Configure App Client** settings
3. **Set up password policies**

### 7.3 Environment Variables
Update service environment variables in ECS:
```bash
# Example: Update assessment service
aws ecs update-service \
  --cluster pageflow-cluster \
  --service assessment-service \
  --force-new-deployment \
  --profile pageflow
```

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Issues
```bash
# If bootstrap fails, try:
npx cdk bootstrap --profile pageflow --force
```

#### 2. Docker Build Issues
```bash
# Ensure Docker is running
docker --version
docker ps

# Check available disk space
df -h
```

#### 3. ECS Service Issues
```bash
# Check service logs
aws logs describe-log-groups --profile pageflow
aws logs tail /aws/pageflow/dev --profile pageflow
```

#### 4. API Gateway Issues
```bash
# Test API endpoints
curl -X GET $API_URL/health
curl -X POST $API_URL/user-service/users \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Debug Commands

#### Check Infrastructure Status
```bash
# List all resources
aws resourcegroupstaggingapi get-resources --profile pageflow

# Check specific service
aws ecs describe-services \
  --cluster pageflow-cluster \
  --services assessment-service \
  --profile pageflow
```

#### Monitor Logs
```bash
# CloudWatch logs
aws logs tail /aws/pageflow/dev --profile pageflow --follow

# ECS service logs
aws logs tail /ecs/assessment-service --profile pageflow --follow
```

## Security Considerations

### 1. Secrets Management
- Store sensitive data in AWS Secrets Manager
- Use IAM roles for service permissions
- Rotate credentials regularly

### 2. Network Security
- Use private subnets for services
- Configure security groups properly
- Enable VPC Flow Logs

### 3. Application Security
- Enable WAF on CloudFront
- Use HTTPS everywhere
- Implement proper authentication

## Monitoring & Maintenance

### 1. Set Up Alerts
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "PageFlow-HighCPU" \
  --alarm-description "High CPU usage" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --profile pageflow
```

### 2. Regular Maintenance
- **Update dependencies** monthly
- **Rotate secrets** quarterly
- **Review access logs** weekly
- **Monitor costs** daily

### 3. Backup Strategy
- **RDS automated backups**
- **S3 versioning**
- **DynamoDB point-in-time recovery**

## Cost Optimization

### 1. Resource Sizing
- Start with minimal resources
- Scale based on actual usage
- Use auto-scaling policies

### 2. Reserved Instances
- Purchase RIs for predictable workloads
- Use Savings Plans for variable workloads

### 3. Monitoring
- Set up cost alerts
- Use AWS Cost Explorer
- Review unused resources

## Next Steps

After successful deployment:

1. **Set up CI/CD pipeline** for automated deployments
2. **Configure monitoring dashboards**
3. **Implement backup and disaster recovery**
4. **Set up staging environment**
5. **Plan production deployment**

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CloudFormation events
3. Check service logs in CloudWatch
4. Consult AWS documentation
5. Contact the development team

---

**Note**: This deployment creates a development environment. For production, additional security, monitoring, and compliance measures should be implemented. 