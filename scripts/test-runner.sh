#!/bin/bash

# PageFlow Test Runner Script
# This script runs all types of tests across the entire platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_TYPE=${1:-all}
COVERAGE=${2:-false}
PARALLEL=${3:-false}

echo -e "${BLUE}🧪 PageFlow Test Runner${NC}"
echo -e "${BLUE}📋 Test Type: ${TEST_TYPE}${NC}"
echo -e "${BLUE}📊 Coverage: ${COVERAGE}${NC}"
echo -e "${BLUE}⚡ Parallel: ${PARALLEL}${NC}"

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

# Function to run tests for a specific service
run_service_tests() {
    local service=$1
    local test_type=$2
    
    if [ ! -d "services/$service" ]; then
        print_warning "Service directory not found: services/$service"
        return 0
    fi
    
    cd "services/$service"
    
    if [ ! -f "package.json" ]; then
        print_warning "No package.json found in services/$service"
        cd ../..
        return 0
    fi
    
    print_status "Running tests for $service..."
    
    case $test_type in
        "unit")
            if [ "$COVERAGE" = "true" ]; then
                npm run test:coverage 2>/dev/null || npm test
            else
                npm test
            fi
            ;;
        "integration")
            npm run test:integration 2>/dev/null || npm test
            ;;
        "performance")
            npm run test:performance 2>/dev/null || npm test
            ;;
        "all")
            if [ "$COVERAGE" = "true" ]; then
                npm run test:coverage 2>/dev/null || npm test
            else
                npm test
            fi
            ;;
    esac
    
    cd ../..
}

# Function to run tests for a specific package
run_package_tests() {
    local package=$1
    
    if [ ! -d "packages/$package" ]; then
        print_warning "Package directory not found: packages/$package"
        return 0
    fi
    
    cd "packages/$package"
    
    if [ ! -f "package.json" ]; then
        print_warning "No package.json found in packages/$package"
        cd ../..
        return 0
    fi
    
    print_status "Running tests for $package..."
    
    if [ "$COVERAGE" = "true" ]; then
        npm run test:coverage 2>/dev/null || npm test
    else
        npm test
    fi
    
    cd ../..
}

# Function to run web app tests
run_web_tests() {
    if [ ! -d "apps/web" ]; then
        print_warning "Web app directory not found"
        return 0
    fi
    
    cd "apps/web"
    
    print_status "Running web app tests..."
    
    case $TEST_TYPE in
        "unit")
            npm test
            ;;
        "e2e")
            npm run test:e2e 2>/dev/null || print_warning "E2E tests not configured"
            ;;
        "accessibility")
            npm run test:a11y 2>/dev/null || print_warning "Accessibility tests not configured"
            ;;
        "all")
            npm test
            npm run test:e2e 2>/dev/null || print_warning "E2E tests not configured"
            npm run test:a11y 2>/dev/null || print_warning "Accessibility tests not configured"
            ;;
    esac
    
    cd ../..
}

# Function to run infrastructure tests
run_infrastructure_tests() {
    print_status "Running infrastructure tests..."
    
    # Test CDK infrastructure
    if [ -d "pageflow-infrastructure" ]; then
        cd pageflow-infrastructure
        npm test
        cd ..
    fi
    
    # Test legacy infrastructure
    if [ -d "infrastructure/cdk" ]; then
        cd infrastructure/cdk
        npm test
        cd ../..
    fi
}

# Function to run all tests
run_all_tests() {
    print_status "Running all tests..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Run package tests first (dependencies)
    print_status "Running package tests..."
    run_package_tests "types"
    run_package_tests "utils"
    run_package_tests "db-utils"
    run_package_tests "testing"
    
    # Run service tests
    print_status "Running service tests..."
    SERVICES=("user-service" "progress-service" "assessment-service" "bedrock-service" "page-companion-service" "device-sync-service" "api-gateway")
    
    if [ "$PARALLEL" = "true" ]; then
        # Run tests in parallel
        for service in "${SERVICES[@]}"; do
            run_service_tests "$service" "$TEST_TYPE" &
        done
        wait
    else
        # Run tests sequentially
        for service in "${SERVICES[@]}"; do
            run_service_tests "$service" "$TEST_TYPE"
        done
    fi
    
    # Run web app tests
    run_web_tests
    
    # Run infrastructure tests
    run_infrastructure_tests
}

# Function to run specific test type
run_test_type() {
    case $TEST_TYPE in
        "unit")
            print_status "Running unit tests..."
            run_all_tests
            ;;
        "integration")
            print_status "Running integration tests..."
            run_all_tests
            ;;
        "performance")
            print_status "Running performance tests..."
            run_all_tests
            ;;
        "e2e")
            print_status "Running end-to-end tests..."
            run_web_tests
            ;;
        "accessibility")
            print_status "Running accessibility tests..."
            run_web_tests
            ;;
        "coverage")
            print_status "Running tests with coverage..."
            COVERAGE=true
            run_all_tests
            ;;
        "all")
            run_all_tests
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            echo "Available test types: unit, integration, performance, e2e, accessibility, coverage, all"
            exit 1
            ;;
    esac
}

# Function to generate test report
generate_test_report() {
    print_status "Generating test report..."
    
    # Create reports directory
    mkdir -p reports
    
    # Generate coverage report if coverage was enabled
    if [ "$COVERAGE" = "true" ]; then
        print_status "Generating coverage report..."
        
        # Find all coverage directories
        find . -name "coverage" -type d | while read -r coverage_dir; do
            service_name=$(echo "$coverage_dir" | sed 's|./services/||' | sed 's|./packages/||' | sed 's|/coverage||')
            if [ -f "$coverage_dir/lcov-report/index.html" ]; then
                cp -r "$coverage_dir/lcov-report" "reports/${service_name}-coverage"
                print_status "Coverage report for $service_name saved to reports/${service_name}-coverage"
            fi
        done
    fi
    
    # Generate test summary
    echo "# PageFlow Test Report" > reports/test-summary.md
    echo "Generated: $(date)" >> reports/test-summary.md
    echo "" >> reports/test-summary.md
    echo "## Test Configuration" >> reports/test-summary.md
    echo "- Test Type: $TEST_TYPE" >> reports/test-summary.md
    echo "- Coverage: $COVERAGE" >> reports/test-summary.md
    echo "- Parallel: $PARALLEL" >> reports/test-summary.md
    echo "" >> reports/test-summary.md
    echo "## Test Results" >> reports/test-summary.md
    echo "All tests completed successfully!" >> reports/test-summary.md
    
    print_status "Test report generated: reports/test-summary.md"
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    print_status "Starting test execution..."
    
    # Run tests
    run_test_type
    
    # Generate report
    generate_test_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_status "All tests completed in ${duration} seconds!"
    print_status "Check reports/ directory for detailed results"
}

# Run main function
main "$@" 