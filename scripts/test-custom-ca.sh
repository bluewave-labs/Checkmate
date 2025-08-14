#!/usr/bin/env bash

# Dev/Test only: Not required in production
# This script tests the custom CA trust functionality in development environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_DIR="${ROOT_DIR}/docker/dev"
CERT_DIR="${DEV_DIR}/certs"
NGINX_DIR="${DEV_DIR}/nginx-test"
COMPOSE_BASELINE="${DEV_DIR}/docker-compose.yaml"
COMPOSE_CUSTOM_CA="${DEV_DIR}/docker-compose.custom-ca-example.yaml"
COMPOSE_NGINX_TEST="${NGINX_DIR}/docker-compose.nginx-test.yaml"

# Test configuration
NGINX_PORT=8443
CHECKMATE_PORT=52345
HEALTH_ENDPOINT="http://localhost:$CHECKMATE_PORT/api/v1/health"
TEST_URL="https://host.docker.internal:$NGINX_PORT"
MAX_WAIT=60
WAIT_INTERVAL=2

# Global flag for cleanup behavior
CLEAN_CERTS=false

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}[PASS]${NC} $message"
            ;;
        "FAIL")
            echo -e "${RED}[FAIL]${NC} $message"
            ;;
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if certificates exist and are valid
check_certificates() {
    local ca_file="${CERT_DIR}/custom-ca.pem"
    local cert_file="${CERT_DIR}/host-int-cert.pem"
    local key_file="${CERT_DIR}/host-int-key.pem"
    
    if [ ! -f "$ca_file" ] || [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        return 1
    fi
    
    # Check if files are not empty
    if [ ! -s "$ca_file" ] || [ ! -s "$cert_file" ] || [ ! -s "$key_file" ]; then
        return 1
    fi
    
    # Check if CA file starts with BEGIN CERTIFICATE
    if ! head -1 "$ca_file" | grep -q "BEGIN CERTIFICATE"; then
        return 1
    fi
    
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local elapsed=0
    
    print_status "INFO" "Waiting for $service_name to be ready..."
    
    while [ $elapsed -lt $MAX_WAIT ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            print_status "PASS" "$service_name is ready after ${elapsed}s"
            return 0
        fi
        
        sleep $WAIT_INTERVAL
        elapsed=$((elapsed + WAIT_INTERVAL))
        echo -n "."
    done
    
    print_status "FAIL" "$service_name failed to start within ${MAX_WAIT}s"
    return 1
}

# Function to get container name by image
get_container_name() {
    local image_name=$1
    docker ps --filter "ancestor=$image_name" --format "{{.Names}}" | head -n1
}

# Function to run Node.js probe test
run_probe_test() {
    local container_name=$1
    local test_name=$2
    local expected_exit_code=$3
    
    print_status "INFO" "Running $test_name probe test..."
    
    local probe_script="
const https = require('https');
https.get('https://host.docker.internal:8443', res => {
  console.log('STATUS', res.statusCode);
  process.exit(res.statusCode===200?0:1);
}).on('error', e => { 
  console.error('ERR', e.code||e.message); 
  process.exit(1); 
});
"
    
    local exit_code
    if docker exec -i "$container_name" node -e "$probe_script" 2>/dev/null; then
        exit_code=$?
    else
        exit_code=$?
    fi
    
    if [ $exit_code -eq $expected_exit_code ]; then
        print_status "PASS" "$test_name probe test completed with expected exit code $expected_exit_code"
        return 0
    else
        print_status "FAIL" "$test_name probe test failed with exit code $exit_code (expected $expected_exit_code)"
        return 1
    fi
}

# Function to setup certificates if needed
setup_certificates_if_needed() {
    if check_certificates; then
        print_status "INFO" "Certificates already exist and are valid, skipping generation"
        return 0
    fi
    
    print_status "INFO" "Certificates missing or invalid, generating new ones..."
    if [ -x "${ROOT_DIR}/scripts/dev/setup-custom-ca.sh" ]; then
        "${ROOT_DIR}/scripts/dev/setup-custom-ca.sh"
    else
        print_status "FAIL" "Certificate setup script not found at scripts/dev/setup-custom-ca.sh"
        return 1
    fi
}

# Function to create nginx test configuration
create_nginx_test_config() {
    print_status "INFO" "Setting up nginx test configuration..."
    
    mkdir -p "$NGINX_DIR"
    
    # Create nginx.conf if it doesn't exist
    if [ ! -f "${NGINX_DIR}/nginx.conf" ]; then
        cat > "${NGINX_DIR}/nginx.conf" << 'EOF'
events {}
http {
    server {
        listen              443 ssl;
        ssl_certificate     /etc/nginx/certs/server.crt;
        ssl_certificate_key /etc/nginx/certs/server.key;
        location / { 
            return 200 "hello from tls\n"; 
        }
    }
}
EOF
    fi
    
    # Create docker-compose.nginx-test.yaml if it doesn't exist
    if [ ! -f "$COMPOSE_NGINX_TEST" ]; then
        cat > "$COMPOSE_NGINX_TEST" << EOF
services:
  nginx-test:
    image: nginx:alpine
    ports:
      - "$NGINX_PORT:443"
    volumes:
      - ../certs/host-int-cert.pem:/etc/nginx/certs/server.crt:ro
      - ../certs/host-int-key.pem:/etc/nginx/certs/server.key:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped
EOF
    fi
    
    print_status "PASS" "Nginx test configuration created"
}

# Function to start nginx test service
start_nginx_test() {
    print_status "INFO" "Starting nginx test service..."
    
    cd "$NGINX_DIR"
    docker-compose -f docker-compose.nginx-test.yaml up -d
    
    # Wait for nginx to be ready
    local elapsed=0
    while [ $elapsed -lt $MAX_WAIT ]; do
        if curl -s -f -k "https://localhost:$NGINX_PORT" >/dev/null 2>&1; then
            print_status "PASS" "Nginx test service is ready"
            cd "$ROOT_DIR"
            return 0
        fi
        
        sleep $WAIT_INTERVAL
        elapsed=$((elapsed + WAIT_INTERVAL))
        echo -n "."
    done
    
    print_status "FAIL" "Nginx test service failed to start"
    cd "$ROOT_DIR"
    return 1
}

# Function to stop nginx test service
stop_nginx_test() {
    print_status "INFO" "Stopping nginx test service..."
    cd "$NGINX_DIR"
    docker-compose -f docker-compose.nginx-test.yaml down 2>/dev/null || true
    cd "$ROOT_DIR"
}

# Function to run baseline test
run_baseline_test() {
    print_status "INFO" "Running baseline test (should fail due to unknown CA)..."
    
    # Start baseline Checkmate
    cd "$DEV_DIR"
    docker-compose -f docker-compose.yaml up -d --build
    
    # Wait for Checkmate to be ready
    if ! wait_for_service "$HEALTH_ENDPOINT" "Checkmate baseline"; then
        cd "$ROOT_DIR"
        return 1
    fi
    
    # Get container name
    local container_name
    container_name=$(get_container_name "uptime_server")
    if [ -z "$container_name" ]; then
        print_status "FAIL" "Could not find Checkmate server container"
        cd "$ROOT_DIR"
        return 1
    fi
    
    # Run probe test (should fail)
    if run_probe_test "$container_name" "baseline" 1; then
        print_status "PASS" "Baseline test completed - TLS failure as expected"
        cd "$ROOT_DIR"
        return 0
    else
        print_status "FAIL" "Baseline test failed - unexpected behavior"
        cd "$ROOT_DIR"
        return 1
    fi
}

# Function to run custom CA test
run_custom_ca_test() {
    print_status "INFO" "Running custom CA test (should succeed)..."
    
    # Stop baseline Checkmate
    cd "$DEV_DIR"
    docker-compose -f docker-compose.yaml down
    
    # Start Checkmate with custom CA
    docker-compose -f docker-compose.yaml -f docker-compose.custom-ca-example.yaml up -d --build
    
    # Wait for Checkmate to be ready
    if ! wait_for_service "$HEALTH_ENDPOINT" "Checkmate custom CA"; then
        cd "$ROOT_DIR"
        return 1
    fi
    
    # Get container name
    local container_name
    container_name=$(get_container_name "uptime_server")
    if [ -z "$container_name" ]; then
        print_status "FAIL" "Could not find Checkmate server container"
        cd "$ROOT_DIR"
        return 1
    fi
    
    # Run probe test (should succeed)
    if run_probe_test "$container_name" "custom CA" 0; then
        print_status "PASS" "Custom CA test completed - TLS success as expected"
        cd "$ROOT_DIR"
        return 0
    else
        print_status "FAIL" "Custom CA test failed - unexpected behavior"
        cd "$ROOT_DIR"
        return 1
    fi
}

# Function to cleanup everything
cleanup() {
    print_status "INFO" "Cleaning up test environment..."
    
    # Stop all services
    cd "$DEV_DIR"
    docker-compose -f docker-compose.yaml down 2>/dev/null || true
    docker-compose -f docker-compose.yaml -f docker-compose.custom-ca-example.yaml down 2>/dev/null || true
    
    stop_nginx_test
    
    # Only remove certificates if --clean was specified
    if [ "$CLEAN_CERTS" = true ]; then
        print_status "INFO" "Removing certificates as requested with --clean"
        rm -rf "${CERT_DIR:?}"/*
    else
        print_status "INFO" "Preserving certificates for future test runs"
    fi
    
    cd "$ROOT_DIR"
    print_status "PASS" "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean    Clean up all test containers and certificates"
    echo "  --help     Show this help message"
    echo ""
    echo "This script tests the custom CA trust functionality in Checkmate."
}

# Main function
main() {
    local clean_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean_only=true
                CLEAN_CERTS=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status "INFO" "Starting Checkmate Custom CA Trust Test"
    echo "=================================================="
    
    if [ "$clean_only" = true ]; then
        cleanup
        exit 0
    fi
    
    # Check prerequisites
    if ! command_exists docker; then
        print_status "FAIL" "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_status "FAIL" "docker-compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "$COMPOSE_BASELINE" ]; then
        print_status "FAIL" "Baseline docker-compose.yaml not found at $COMPOSE_BASELINE"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_CUSTOM_CA" ]; then
        print_status "FAIL" "Custom CA docker-compose override not found at $COMPOSE_CUSTOM_CA"
        exit 1
    fi
    
    # Setup test environment
    setup_certificates_if_needed
    create_nginx_test_config
    start_nginx_test
    
    # Run tests
    local baseline_result=false
    local custom_ca_result=false
    
    if run_baseline_test; then
        baseline_result=true
    fi
    
    if run_custom_ca_test; then
        custom_ca_result=true
    fi
    
    # Print summary
    echo ""
    echo "=================================================="
    print_status "INFO" "Test Summary"
    echo "=================================================="
    
    if [ "$baseline_result" = true ]; then
        print_status "PASS" "Baseline: TLS failure as expected"
    else
        print_status "FAIL" "Baseline: Unexpected behavior"
    fi
    
    if [ "$custom_ca_result" = true ]; then
        print_status "PASS" "Custom CA: TLS success (STATUS 200)"
    else
        print_status "FAIL" "Custom CA: Unexpected behavior"
    fi
    
    if [ "$baseline_result" = true ] && [ "$custom_ca_result" = true ]; then
        echo ""
        print_status "PASS" "All tests passed! Custom CA trust is working correctly."
        echo ""
        print_status "INFO" "To clean up, run: $0 --clean"
        exit 0
    else
        echo ""
        print_status "FAIL" "Some tests failed. Custom CA trust may not be working correctly."
        echo ""
        print_status "INFO" "To clean up, run: $0 --clean"
        exit 1
    fi
}

# Trap cleanup on script exit
trap cleanup EXIT

# Run main function
main "$@"
