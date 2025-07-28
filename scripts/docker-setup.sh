#!/bin/bash

# PageFlow Docker Setup Script
# This script helps set up and manage the Docker development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed and running
check_docker() {
    print_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_status "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_info "Checking Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    print_status "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p docker/postgres
    mkdir -p logs
    mkdir -p .docker/data
    
    print_status "Directories created"
}

# Create PostgreSQL initialization script
create_postgres_init() {
    print_info "Creating PostgreSQL initialization script..."
    
    cat > docker/postgres/init.sql << 'EOF'
-- Create PageFlow database
CREATE DATABASE IF NOT EXISTS pageflow_dev;
CREATE DATABASE IF NOT EXISTS pageflow_test;

-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'pageflow_user') THEN
        CREATE USER pageflow_user WITH PASSWORD 'pageflow_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pageflow_dev TO pageflow_user;
GRANT ALL PRIVILEGES ON DATABASE pageflow_test TO pageflow_user;

-- Connect to pageflow_dev
\c pageflow_dev;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic tables (these will be managed by the application)
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'LEARNER',
    preferences JSONB DEFAULT '{}',
    profile_picture VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path_id VARCHAR(255) NOT NULL,
    module_progress JSONB DEFAULT '[]',
    overall_completion INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    device_sync_status JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_path_id ON progress(path_id);

-- Grant permissions to pageflow_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pageflow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pageflow_user;
EOF

    print_status "PostgreSQL initialization script created"
}

# Create environment file
create_env_file() {
    print_info "Creating environment file..."
    
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# PageFlow Development Environment

# Database
POSTGRES_DB=pageflow_dev
POSTGRES_USER=pageflow_user
POSTGRES_PASSWORD=pageflow_password
DATABASE_URL=postgresql://pageflow_user:pageflow_password@postgres:5432/pageflow_dev

# Redis
REDIS_URL=redis://redis:6379

# AWS (LocalStack)
AWS_ENDPOINT=http://localstack:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Services
USER_SERVICE_URL=http://user-service:3001
PROGRESS_SERVICE_URL=http://progress-service:3002
ASSESSMENT_SERVICE_URL=http://assessment-service:3003
BEDROCK_SERVICE_URL=http://bedrock-service:3004
PAGE_COMPANION_SERVICE_URL=http://page-companion-service:3005
DEVICE_SYNC_SERVICE_URL=http://device-sync-service:3006

# API Gateway
API_GATEWAY_PORT=3000

# Web Application
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AMPLIFY_REGION=us-east-1

# Development
NODE_ENV=development
LOG_LEVEL=debug
EOF
        print_status "Environment file created"
    else
        print_warning "Environment file already exists"
    fi
}

# Build and start services
start_services() {
    local service=${1:-all}
    
    print_info "Starting PageFlow services..."
    
    if [ "$service" = "all" ]; then
        # Start infrastructure services first
        print_info "Starting infrastructure services..."
        docker-compose up -d postgres redis localstack
        
        # Wait for infrastructure to be ready
        print_info "Waiting for infrastructure services to be ready..."
        sleep 10
        
        # Start all services
        print_info "Starting all services..."
        docker-compose up -d
    else
        print_info "Starting $service service..."
        docker-compose up -d $service
    fi
    
    print_status "Services started"
}

# Stop services
stop_services() {
    local service=${1:-all}
    
    print_info "Stopping PageFlow services..."
    
    if [ "$service" = "all" ]; then
        docker-compose down
    else
        docker-compose stop $service
    fi
    
    print_status "Services stopped"
}

# Show service status
show_status() {
    print_info "PageFlow service status:"
    docker-compose ps
}

# Show logs
show_logs() {
    local service=${1:-all}
    
    if [ "$service" = "all" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f $service
    fi
}

# Clean up
cleanup() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Cleaning up Docker resources..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_status "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Run tests in Docker
run_tests() {
    print_info "Running tests in Docker..."
    docker-compose run --rm test-runner
}

# Build services
build_services() {
    local service=${1:-all}
    
    print_info "Building PageFlow services..."
    
    if [ "$service" = "all" ]; then
        docker-compose build
    else
        docker-compose build $service
    fi
    
    print_status "Services built"
}

# Show help
show_help() {
    echo "PageFlow Docker Setup Script"
    echo ""
    echo "Usage: $0 [COMMAND] [SERVICE]"
    echo ""
    echo "Commands:"
    echo "  setup           Set up the Docker environment (check dependencies, create files)"
    echo "  start [SERVICE] Start services (default: all)"
    echo "  stop [SERVICE]  Stop services (default: all)"
    echo "  restart [SERVICE] Restart services (default: all)"
    echo "  status          Show service status"
    echo "  logs [SERVICE]  Show logs (default: all)"
    echo "  build [SERVICE] Build services (default: all)"
    echo "  test            Run tests in Docker"
    echo "  cleanup         Remove all containers, volumes, and images"
    echo "  help            Show this help message"
    echo ""
    echo "Services:"
    echo "  postgres, redis, localstack, user-service, progress-service,"
    echo "  assessment-service, bedrock-service, page-companion-service,"
    echo "  device-sync-service, api-gateway, web-app"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # Set up the environment"
    echo "  $0 start                    # Start all services"
    echo "  $0 start user-service       # Start only user service"
    echo "  $0 logs api-gateway         # Show API gateway logs"
    echo "  $0 test                     # Run tests"
}

# Main function
main() {
    local command=${1:-help}
    local service=${2:-all}
    
    case $command in
        setup)
            check_docker
            check_docker_compose
            create_directories
            create_postgres_init
            create_env_file
            print_status "Docker environment setup completed!"
            print_info "Run '$0 start' to start the services"
            ;;
        start)
            start_services $service
            ;;
        stop)
            stop_services $service
            ;;
        restart)
            stop_services $service
            sleep 2
            start_services $service
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs $service
            ;;
        build)
            build_services $service
            ;;
        test)
            run_tests
            ;;
        cleanup)
            cleanup
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@" 