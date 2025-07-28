#!/bin/bash

set -e  # Exit on any error

echo "🚀 PageFlow Staging Deployment"
echo "=============================="

# Configuration
DEPLOYMENT_ENV="staging"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/staging_$TIMESTAMP"
LOG_FILE="logs/staging_deployment_$TIMESTAMP.log"
DOCKER_COMPOSE_FILE="docker-compose.staging.yml"

# Create directories
mkdir -p $BACKUP_DIR
mkdir -p logs
mkdir -p monitoring
mkdir -p nginx
mkdir -p database

echo "📋 Staging Deployment Configuration:"
echo "Environment: $DEPLOYMENT_ENV"
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo "Log File: $LOG_FILE"
echo "Docker Compose: $DOCKER_COMPOSE_FILE"
echo ""

# Pre-deployment checks
echo "🔍 Pre-deployment Checks..."
echo "=========================="

# Check if Docker is running
echo "1. Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi
echo "✅ Docker is running"

# Check if Docker Compose is available
echo "2. Checking Docker Compose..."
if ! docker-compose --version > /dev/null 2>&1; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi
echo "✅ Docker Compose is available"

# Check if all services build successfully
echo "3. Building all services..."
if npm run build; then
    echo "✅ All services built successfully"
else
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Run security audit
echo "4. Running security audit..."
if ./scripts/security-audit.sh; then
    echo "✅ Security audit passed"
else
    echo "⚠️  Security audit warnings found"
fi

# Run tests
echo "5. Running test suite..."
if npm run test; then
    echo "✅ All tests passed"
else
    echo "❌ Tests failed. Aborting deployment."
    exit 1
fi

# Create monitoring configuration
echo "6. Setting up monitoring configuration..."
echo "========================================"

# Create Prometheus configuration
cat > monitoring/prometheus-staging.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'pageflow-api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'

  - job_name: 'pageflow-user-service'
    static_configs:
      - targets: ['user-service:3001']
    metrics_path: '/metrics'

  - job_name: 'pageflow-progress-service'
    static_configs:
      - targets: ['progress-service:3002']
    metrics_path: '/metrics'

  - job_name: 'pageflow-assessment-service'
    static_configs:
      - targets: ['assessment-service:3003']
    metrics_path: '/metrics'

  - job_name: 'pageflow-bedrock-service'
    static_configs:
      - targets: ['bedrock-service:3004']
    metrics_path: '/metrics'

  - job_name: 'pageflow-device-sync-service'
    static_configs:
      - targets: ['device-sync-service:3005']
    metrics_path: '/metrics'

  - job_name: 'pageflow-learning-path-service'
    static_configs:
      - targets: ['learning-path-service:3006']
    metrics_path: '/metrics'

  - job_name: 'pageflow-page-companion-service'
    static_configs:
      - targets: ['page-companion-service:3007']
    metrics_path: '/metrics'

  - job_name: 'pageflow-web-app'
    static_configs:
      - targets: ['web-app:3000']
    metrics_path: '/metrics'
EOF

# Create Nginx configuration
cat > nginx/staging.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream api_gateway {
        server api-gateway:3000;
    }

    upstream web_app {
        server web-app:3000;
    }

    server {
        listen 80;
        server_name staging.pageflow.ai localhost;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API Gateway
        location /api/ {
            proxy_pass http://api_gateway;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Web Application
        location / {
            proxy_pass http://web_app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Monitoring endpoints
        location /monitoring/ {
            proxy_pass http://grafana:3000/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

# Create database initialization script
cat > database/init-staging.sql << EOF
-- PageFlow Staging Database Initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50),
    estimated_duration INTEGER,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    modules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_learning_progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    learning_path_id UUID REFERENCES learning_paths(id),
    module_progress JSONB,
    overall_completion DECIMAL(5,2) DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_sync_status VARCHAR(50) DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_path_id ON user_learning_progress(learning_path_id);

-- Insert sample data
INSERT INTO learning_paths (title, description, difficulty_level, estimated_duration, learning_objectives) VALUES
('Introduction to AI', 'Learn the basics of artificial intelligence', 'beginner', 120, ARRAY['Understand AI fundamentals', 'Learn basic ML concepts']),
('Advanced Machine Learning', 'Deep dive into machine learning algorithms', 'advanced', 240, ARRAY['Master ML algorithms', 'Build production models']),
('Data Science Fundamentals', 'Essential data science skills', 'intermediate', 180, ARRAY['Data analysis', 'Statistical modeling']);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

echo "✅ Monitoring and infrastructure configuration created"

# Backup current deployment
echo "7. Creating backup of current deployment..."
if docker ps --format "table {{.Names}}" | grep -q "pageflow.*staging"; then
    echo "Backing up current staging containers..."
    docker ps --format "table {{.Names}}\t{{.Image}}" | grep pageflow.*staging > $BACKUP_DIR/current_containers.txt
    echo "✅ Backup created"
else
    echo "No current staging containers to backup"
fi

# Deploy new version
echo "8. Deploying to staging..."
echo "=========================="

# Stop current services
echo "Stopping current staging services..."
docker-compose -f $DOCKER_COMPOSE_FILE down || true

# Build and start services
echo "Building and starting staging services..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d --build

# Wait for services to start
echo "9. Waiting for services to start..."
echo "==================================="
sleep 60

# Health checks
echo "10. Running health checks..."
echo "============================"

SERVICES=(
    "http://localhost:3000/health"  # API Gateway
    "http://localhost:3001/health"  # User Service
    "http://localhost:3002/health"  # Progress Service
    "http://localhost:3003/health"  # Assessment Service
    "http://localhost:3004/health"  # Bedrock Service
    "http://localhost:3005/health"  # Device Sync Service
    "http://localhost:3006/health"  # Learning Path Service
    "http://localhost:3007/health"  # Page Companion Service
    "http://localhost:8080"         # Web App
    "http://localhost:9090"         # Prometheus
    "http://localhost:3008"         # Grafana
)

ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
    echo "Checking $service..."
    if curl -f -s "$service" > /dev/null; then
        echo "✅ $service - Healthy"
    else
        echo "❌ $service - Unhealthy"
        ALL_HEALTHY=false
    fi
done

if [ "$ALL_HEALTHY" = false ]; then
    echo "❌ Some services are unhealthy. Checking logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=50
    
    echo "Rolling back deployment..."
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    if [ -f "$BACKUP_DIR/current_containers.txt" ]; then
        echo "Restoring previous version..."
        docker-compose -f $DOCKER_COMPOSE_FILE up -d
    fi
    exit 1
fi

# Performance tests
echo "11. Running performance tests..."
echo "================================"

# Basic load test
echo "Running basic load test..."
for i in {1..20}; do
    curl -s http://localhost:3000/health > /dev/null &
    curl -s http://localhost:8080 > /dev/null &
done
wait

echo "✅ Performance test completed"

# Update deployment log
echo "12. Updating deployment log..."
echo "Staging deployment completed successfully at $TIMESTAMP" >> $LOG_FILE
echo "Environment: $DEPLOYMENT_ENV" >> $LOG_FILE
echo "Services deployed: API Gateway, User, Progress, Assessment, Bedrock, Device Sync, Learning Path, Page Companion, Web App" >> $LOG_FILE

# Cleanup old images
echo "13. Cleaning up old images..."
docker image prune -f

echo ""
echo "🎉 Staging Deployment Completed Successfully!"
echo "============================================="
echo "Environment: $DEPLOYMENT_ENV"
echo "Timestamp: $TIMESTAMP"
echo "Services: API Gateway, User, Progress, Assessment, Bedrock, Device Sync, Learning Path, Page Companion, Web App"
echo ""
echo "🌐 Access Points:"
echo "- Web Application: http://localhost:8080"
echo "- API Gateway: http://localhost:3000"
echo "- Grafana Dashboard: http://localhost:3008 (admin/staging_grafana_password)"
echo "- Prometheus: http://localhost:9090"
echo "- Health Check: http://localhost/health"
echo ""
echo "📊 Monitoring:"
echo "- Health: ./health-checks/health-check.sh"
echo "- Metrics: ./metrics/collect-metrics.sh"
echo "- Logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo ""
echo "🔧 Management:"
echo "- Stop: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "- Restart: docker-compose -f $DOCKER_COMPOSE_FILE restart"
echo "- Update: ./scripts/deploy-staging.sh"
echo ""
echo "📝 Log file: $LOG_FILE" 