#!/usr/bin/env bash

# Dev/Test only: Not required in production
# This script generates test certificates for development and testing purposes

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CERTS_DIR="$REPO_ROOT/docker/dev/certs"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}[PASS]${NC} $message"
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

# Function to generate certificates using mkcert
generate_certs_mkcert() {
    print_status "INFO" "Generating certificates using mkcert..."
    
    # Install mkcert CA (ignore if already done)
    mkcert -install 2>/dev/null || true
    
    # Copy root CA
    local ca_root
    ca_root=$(mkcert -CAROOT)
    cp "$ca_root/rootCA.pem" "$CERTS_DIR/custom-ca.pem"
    
    # Generate server certificate
    mkcert -key-file "$CERTS_DIR/host-int-key.pem" \
            -cert-file "$CERTS_DIR/host-int-cert.pem" \
            host.docker.internal
    
    print_status "PASS" "Certificates generated using mkcert"
}

# Function to generate certificates using OpenSSL
generate_certs_openssl() {
    print_status "INFO" "Generating certificates using OpenSSL..."
    
    # Create CA private key
    openssl genrsa -out "$CERTS_DIR/ca.key" 2048
    
    # Create CA certificate
    openssl req -new -x509 -days 365 -key "$CERTS_DIR/ca.key" \
        -out "$CERTS_DIR/custom-ca.pem" \
        -subj "/C=US/ST=Test/L=Test/O=Test CA/CN=Test Root CA"
    
    # Create server private key
    openssl genrsa -out "$CERTS_DIR/host-int-key.pem" 2048
    
    # Create server certificate signing request
    openssl req -new -key "$CERTS_DIR/host-int-key.pem" \
        -out "$CERTS_DIR/host-int-cert.csr" \
        -subj "/C=US/ST=Test/L=Test/O=Test/CN=host.docker.internal"
    
    # Create extfile for SAN
    cat > "$CERTS_DIR/san.ext" << EOF
subjectAltName=DNS:host.docker.internal,IP:127.0.0.1
EOF
    
    # Sign server certificate with CA
    openssl x509 -req -days 365 \
        -in "$CERTS_DIR/host-int-cert.csr" \
        -CA "$CERTS_DIR/custom-ca.pem" \
        -CAkey "$CERTS_DIR/ca.key" \
        -CAcreateserial \
        -out "$CERTS_DIR/host-int-cert.pem" \
        -extfile "$CERTS_DIR/san.ext"
    
    # Clean up temporary files
    rm -f "$CERTS_DIR/ca.key" "$CERTS_DIR/host-int-cert.csr" "$CERTS_DIR/san.ext" "$CERTS_DIR/.srl"
    
    print_status "PASS" "Certificates generated using OpenSSL"
}

# Main function
main() {
    print_status "INFO" "Setting up custom CA certificates for Checkmate testing"
    echo "================================================================"
    
    # Create certs directory if missing
    print_status "INFO" "Creating certificates directory..."
    mkdir -p "$CERTS_DIR"
    
    # Generate certificates
    if command_exists mkcert; then
        generate_certs_mkcert
    else
        print_status "WARN" "mkcert not found, falling back to OpenSSL"
        generate_certs_openssl
    fi
    
    # Create duplicate for compatibility with existing overrides
    print_status "INFO" "Creating duplicate CA file for compatibility..."
    cp "$CERTS_DIR/custom-ca.pem" "$CERTS_DIR/smallstep-root-ca.pem"
    
    # Verify certificates exist
    if [ ! -f "$CERTS_DIR/custom-ca.pem" ] || [ ! -f "$CERTS_DIR/host-int-cert.pem" ] || [ ! -f "$CERTS_DIR/host-int-key.pem" ]; then
        echo "Error: Failed to generate required certificates"
        exit 1
    fi
    
    # Print summary
    echo ""
    print_status "PASS" "All required certificates generated successfully"
    echo ""
    echo "Certificate summary:"
    echo "===================="
    ls -l "$CERTS_DIR"
    echo ""
    echo "CA certificate preview:"
    echo "======================"
    head -3 "$CERTS_DIR/custom-ca.pem"
    echo ""
    print_status "INFO" "Certificates are ready for use with Checkmate custom CA trust"
}

# Run main function
main "$@"
