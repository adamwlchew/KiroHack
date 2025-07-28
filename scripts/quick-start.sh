#!/bin/bash

# PageFlow Quick Start Script
# This script provides a minimal setup for immediate deployment

set -e

echo "🚀 PageFlow Quick Start"
echo "========================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run:"
    echo "   aws configure"
    echo "   Then run this script again."
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating environment file..."
    cp env.example .env
    echo "📝 Please edit .env with your configuration"
    echo "   Key items to update:"
    echo "   - AWS_REGION"
    echo "   - ENVIRONMENT"
    echo "   - Database credentials"
    echo ""
    echo "Press Enter when ready to continue..."
    read
fi

# Bootstrap CDK if needed
echo "🔧 Setting up CDK..."
cd pageflow-infrastructure
npm install
npm run build

# Check if CDK is bootstrapped
if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
    echo "🚀 Bootstrapping CDK..."
    npx cdk bootstrap
else
    echo "✅ CDK already bootstrapped"
fi

# Deploy infrastructure
echo "🏗️  Deploying infrastructure..."
npx cdk deploy --all --context environment=dev

cd ..

echo ""
echo "🎉 Infrastructure deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Build and deploy services: npm run deploy"
echo "2. Set up your web application"
echo "3. Configure authentication"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md" 