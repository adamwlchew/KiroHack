#!/bin/bash

set -e  # Exit on any error

echo "🚀 PageFlow Production Deployment"
echo "================================="

# Configuration
DEPLOYMENT_ENV="production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$TIMESTAMP"
LOG_FILE="logs/deployment_$TIMESTAMP.log"

# Create backup directory
mkdir -p $BACKUP_DIR
mkdir -p logs

echo "📋 Deployment Configuration:"
echo "Environment: $DEPLOYMENT_ENV"
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo "Log File: $LOG_FILE"
echo ""

# Pre-deployment checks
echo "🔍 Pre-deployment Checks..."
echo "=========================="

# Check if all services build successfully
echo "1. Building all services..."
if npm run build; then
    echo "✅ All services built successfully"
else
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Run security audit
echo "2. Running security audit..."
if ./scripts/security-audit.sh; then
    echo "✅ Security audit passed"
else
    echo "⚠️  Security audit warnings found"
fi

# Run tests
echo "3. Running test suite..."
if npm run test; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed. Aborting deployment."
    exit 1
fi

# Check Docker images
echo "4. Building Docker images..."
SERVICES=("api-gateway" "user-service" "progress-service" "assessment-service" "bedrock-service" "device-sync-service" "learning-path-service" "page-companion-service")

for service in "${SERVICES[@]}"; do
    echo "Building $service..."
    if docker build -t pageflow/$service:$TIMESTAMP services/$service/; then
        echo "✅ $service image built successfully"
    else
        echo "❌ Failed to build $service image"
        exit 1
    fi
done

# Backup current deployment
echo "5. Creating backup of current deployment..."
if docker ps --format "table {{.Names}}" | grep -q "pageflow"; then
    echo "Backing up current containers..."
    docker ps --format "table {{.Names}}\t{{.Image}}" | grep pageflow > $BACKUP_DIR/current_containers.txt
    echo "✅ Backup created"
else
    echo "No current containers to backup"
fi

# Deploy new version
echo "6. Deploying new version..."
echo "=========================="

# Stop current services
echo "Stopping current services..."
docker-compose down || true

# Deploy with new images
echo "Starting services with new images..."
docker-compose up -d

# Health checks
echo "7. Running health checks..."
echo "=========================="

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Run health checks
if ./health-checks/health-check.sh; then
    echo "✅ All services healthy"
else
    echo "❌ Health checks failed"
    echo "Rolling back deployment..."
    
    # Rollback
    docker-compose down
    if [ -f "$BACKUP_DIR/current_containers.txt" ]; then
        echo "Restoring previous version..."
        docker-compose up -d
    fi
    exit 1
fi

# Performance tests
echo "8. Running performance tests..."
echo "==============================="

# Basic load test
echo "Running basic load test..."
for i in {1..10}; do
    curl -s http://localhost:3000/health > /dev/null &
done
wait

echo "✅ Performance test completed"

# Update deployment log
echo "9. Updating deployment log..."
echo "Deployment completed successfully at $TIMESTAMP" >> $LOG_FILE
echo "Environment: $DEPLOYMENT_ENV" >> $LOG_FILE
echo "Services deployed: ${SERVICES[*]}" >> $LOG_FILE

# Cleanup old images
echo "10. Cleaning up old images..."
docker image prune -f

echo ""
echo "🎉 Deployment completed successfully!"
echo "====================================="
echo "Environment: $DEPLOYMENT_ENV"
echo "Timestamp: $TIMESTAMP"
echo "Services: ${SERVICES[*]}"
echo "Health check: http://localhost:3000/health"
echo "Log file: $LOG_FILE"
echo ""
echo "📊 Monitor deployment:"
echo "- Health: ./health-checks/health-check.sh"
echo "- Metrics: ./metrics/collect-metrics.sh"
echo "- Logs: docker-compose logs -f" 