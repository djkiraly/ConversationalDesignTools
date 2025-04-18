#!/bin/bash

# Master Deployment Script
# This script orchestrates the full deployment process
# Usage: ./master-deploy.sh [--docker | --manual] [--with-ssl domain.com]

set -e  # Exit immediately if a command exits with a non-zero status

# Default values
DEPLOYMENT_TYPE="manual"
USE_SSL=false
DOMAIN=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --docker)
            DEPLOYMENT_TYPE="docker"
            shift
            ;;
        --manual)
            DEPLOYMENT_TYPE="manual"
            shift
            ;;
        --with-ssl)
            USE_SSL=true
            DOMAIN="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--docker | --manual] [--with-ssl domain.com]"
            exit 1
            ;;
    esac
done

# Function to check for required tools
check_requirements() {
    echo "Checking deployment requirements..."
    
    # Check for required tools
    command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting."; exit 1; }
    
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
        command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting."; exit 1; }
    fi
    
    if [ "$USE_SSL" = true ]; then
        command -v openssl >/dev/null 2>&1 || { echo "OpenSSL is required but not installed. Aborting."; exit 1; }
    fi
    
    echo "✅ All required tools are available."
}

# Function to check for environment variables
check_env_vars() {
    echo "Checking environment variables..."
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo "❌ .env file not found. Creating from template..."
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            echo "✅ Created .env file from template. Please edit with your settings."
            echo "   Edit the file at: $PROJECT_ROOT/.env"
            exit 1
        else
            echo "❌ .env.example template not found. Aborting."
            exit 1
        fi
    fi
    
    # Source environment variables
    source "$PROJECT_ROOT/.env"
    
    # Check for required variables
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL is not set in .env file. Aborting."
        exit 1
    fi
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ OPENAI_API_KEY is not set in .env file. Aborting."
        exit 1
    fi
    
    echo "✅ Environment variables look good."
}

# Function to deploy using Docker
deploy_with_docker() {
    echo "Deploying with Docker..."
    
    # Navigate to project root
    cd "$PROJECT_ROOT"
    
    # Copy Nginx configuration based on SSL setting
    if [ "$USE_SSL" = true ]; then
        echo "Setting up SSL for domain: $DOMAIN"
        "$SCRIPT_DIR/setup-ssl.sh" --self-signed "$DOMAIN"
        
        # Update domain in docker-compose.yml
        sed -i "s/DOMAIN_NAME=example.com/DOMAIN_NAME=$DOMAIN/" .env
    fi
    
    # Build and start the Docker containers
    docker-compose up --build -d
    
    echo "✅ Docker deployment completed."
}

# Function to deploy manually
deploy_manually() {
    echo "Deploying manually..."
    
    # Navigate to project root
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Build the application
    echo "Building the application..."
    npm run build
    
    # Run database migrations
    echo "Running database migrations..."
    npm run db:push
    
    # Start the application
    echo "Starting the application..."
    if command -v systemctl >/dev/null 2>&1; then
        echo "Do you want to install as a systemd service? (y/n)"
        read -r install_service
        if [[ $install_service =~ ^[Yy]$ ]]; then
            sudo "$SCRIPT_DIR/install-service.sh" "$PROJECT_ROOT"
        else
            echo "To start the application manually, run: npm start"
        fi
    else
        echo "To start the application, run: npm start"
    fi
    
    # Setup SSL if requested
    if [ "$USE_SSL" = true ]; then
        echo "Setting up SSL for domain: $DOMAIN"
        if command -v certbot >/dev/null 2>&1; then
            "$SCRIPT_DIR/setup-ssl.sh" --lets-encrypt "$DOMAIN"
        else
            "$SCRIPT_DIR/setup-ssl.sh" --self-signed "$DOMAIN"
            echo "⚠️ Certbot not found. Created self-signed certificate instead."
            echo "   For production, install Certbot and run: ./scripts/setup-ssl.sh --lets-encrypt $DOMAIN"
        fi
    fi
    
    echo "✅ Manual deployment completed."
}

# Function to verify deployment
verify_deployment() {
    echo "Verifying deployment..."
    
    # Wait a bit for services to start
    echo "Waiting for services to start..."
    sleep 10
    
    # Run verification script
    "$SCRIPT_DIR/verify-deployment.sh"
    
    # Check result
    if [ $? -eq 0 ]; then
        echo "✅ Deployment verified successfully!"
    else
        echo "⚠️ Some verification checks failed. See above for details."
    fi
}

# Main deployment process
echo "==============================================="
echo "Conversational AI Workflow Builder Deployment"
echo "==============================================="
echo "Deployment type: $DEPLOYMENT_TYPE"
echo "SSL enabled: $USE_SSL"
if [ "$USE_SSL" = true ]; then
    echo "Domain: $DOMAIN"
fi
echo "-----------------------------------------------"

# Run pre-deployment checks
check_requirements
check_env_vars

# Perform deployment based on selected type
if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
    deploy_with_docker
else
    deploy_manually
fi

# Verify deployment
verify_deployment

echo "==============================================="
echo "Deployment process completed!"
echo "==============================================="
echo "Next steps:"
echo "1. Ensure the application is running properly"
echo "2. Set up regular database backups using scripts/db-backup.sh"
echo "3. Configure monitoring and alerts"
echo "4. Review the DEPLOYMENT_CHECKLIST.md for additional configuration"
echo "==============================================="