#!/bin/bash

# PageFlow Deployment Script
# This script deploys the entire PageFlow platform to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_PROFILE=${2:-pageflow}
REGION=${3:-us-east-1}

echo -e "${BLUE}🚀 Starting PageFlow deployment for environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}📋 Using AWS profile: ${AWS_PROFILE}${NC}"
echo -e "${BLUE}🌍 AWS Region: ${REGION}${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
        print_error "AWS credentials not configured for profile: $AWS_PROFILE"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install workspace dependencies
    npm run install:all
    
    print_status "Dependencies installed"
}

# Build all packages and services
build_all() {
    print_status "Building all packages and services..."
    
    # Build shared packages first
    npm run build:packages
    
    # Build all services
    npm run build:services
    
    # Build web app
    npm run build:web
    
    print_status "Build completed"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure..."
    
    cd pageflow-infrastructure
    
    # Bootstrap CDK if needed
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit --profile $AWS_PROFILE &> /dev/null; then
        print_warning "CDK not bootstrapped. Bootstrapping now..."
        npx cdk bootstrap --profile $AWS_PROFILE
    fi
    
    # Deploy infrastructure
    npx cdk deploy --all --profile $AWS_PROFILE --context environment=$ENVIRONMENT
    
    cd ..
    
    print_status "Infrastructure deployed"
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Get ECR repository URLs from CDK outputs
    ECR_BASE_URL=$(aws cloudformation describe-stacks \
        --stack-name PageflowInfrastructureStack-$ENVIRONMENT \
        --profile $AWS_PROFILE \
        --query 'Stacks[0].Outputs[?OutputKey==`EcrBaseUrl`].OutputValue' \
        --output text)
    
    if [ -z "$ECR_BASE_URL" ]; then
        print_error "Could not get ECR base URL from CloudFormation outputs"
        exit 1
    fi
    
    # Login to ECR
    aws ecr get-login-password --region $REGION --profile $AWS_PROFILE | \
        docker login --username AWS --password-stdin $ECR_BASE_URL
    
    # Build and push each service
    SERVICES=("user-service" "progress-service" "assessment-service" "bedrock-service" "page-companion-service" "device-sync-service")
    
    for service in "${SERVICES[@]}"; do
        if [ -d "services/$service" ]; then
            print_status "Building and pushing $service..."
            
            # Build image
            docker build -t $service services/$service/
            
            # Tag image
            docker tag $service:latest $ECR_BASE_URL/$service:latest
            
            # Push image
            docker push $ECR_BASE_URL/$service:latest
            
            print_status "$service image pushed"
        else
            print_warning "Service directory not found: services/$service"
        fi
    done
    
    print_status "All Docker images built and pushed"
}

# Deploy services
deploy_services() {
    print_status "Deploying services..."
    
    # Get ECS cluster name from CDK outputs
    CLUSTER_NAME=$(aws cloudformation describe-stacks \
        --stack-name PageflowInfrastructureStack-$ENVIRONMENT \
        --profile $AWS_PROFILE \
        --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' \
        --output text)
    
    if [ -z "$CLUSTER_NAME" ]; then
        print_error "Could not get ECS cluster name from CloudFormation outputs"
        exit 1
    fi
    
    # Update each service
    SERVICES=("user-service" "progress-service" "assessment-service" "bedrock-service" "page-companion-service" "device-sync-service")
    
    for service in "${SERVICES[@]}"; do
        if [ -d "services/$service" ]; then
            print_status "Updating $service..."
            
            # Force new deployment
            aws ecs update-service \
                --cluster $CLUSTER_NAME \
                --service $service \
                --force-new-deployment \
                --profile $AWS_PROFILE \
                --region $REGION
            
            print_status "$service deployment triggered"
        fi
    done
    
    print_status "All services deployment triggered"
}

# Deploy web application
deploy_web_app() {
    print_status "Deploying web application..."
    
    # Get Amplify app ID from CDK outputs
    AMPLIFY_APP_ID=$(aws cloudformation describe-stacks \
        --stack-name PageflowInfrastructureStack-$ENVIRONMENT \
        --profile $AWS_PROFILE \
        --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
        --output text)
    
    if [ -z "$AMPLIFY_APP_ID" ]; then
        print_error "Could not get Amplify app ID from CloudFormation outputs"
        exit 1
    fi
    
    # Build web app
    cd apps/web
    npm run build
    
    # Deploy to Amplify (this would typically be done via Git push)
    print_warning "Web app deployment via Amplify requires Git push to configured repository"
    print_status "Please push your changes to the main branch to trigger deployment"
    
    cd ../..
    
    print_status "Web application deployment instructions provided"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run all tests
    npm test
    
    print_status "Tests completed"
}

# Main deployment flow
main() {
    echo -e "${BLUE}📦 Starting deployment process...${NC}"
    
    check_prerequisites
    install_dependencies
    run_tests
    build_all
    deploy_infrastructure
    build_and_push_images
    deploy_services
    deploy_web_app
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}📊 Check the AWS Console for deployment status${NC}"
    echo -e "${BLUE}🔗 API Gateway URL will be available in CloudFormation outputs${NC}"
}

# Run main function
main "$@" 