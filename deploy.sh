#!/bin/bash

# Conversational AI Workflow Builder Deployment Script
# This script automates the deployment of the application on a new server

set -e  # Exit immediately if a command exits with a non-zero status

# Display help menu
function show_help {
    echo "Usage: $0 [OPTIONS]"
    echo "Deploy the Conversational AI Workflow Builder application"
    echo ""
    echo "Options:"
    echo "  -h, --help                 Display this help message"
    echo "  -d, --database-url URL     Set PostgreSQL database URL"
    echo "  -o, --openai-key KEY       Set OpenAI API key"
    echo "  -p, --port PORT            Set application port (default: 5000)"
    echo "  -e, --env ENV              Set Node environment (default: production)"
    echo ""
    echo "Example:"
    echo "  $0 --database-url postgresql://user:pass@localhost:5432/dbname --openai-key sk-yourapikey"
    exit 0
}

# Default values
PORT=5000
NODE_ENV="production"
DATABASE_URL=""
OPENAI_API_KEY=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            show_help
            ;;
        -d|--database-url)
            DATABASE_URL="$2"
            shift 2
            ;;
        -o|--openai-key)
            OPENAI_API_KEY="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -e|--env)
            NODE_ENV="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check for required arguments
if [ -z "$DATABASE_URL" ]; then
    echo "Error: Database URL is required. Use --database-url to specify."
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OpenAI API key is required. Use --openai-key to specify."
    exit 1
fi

# Check if the current directory contains package.json
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "==== Starting Deployment ===="
echo "Node Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database URL: ${DATABASE_URL:0:15}******" # Show only beginning for security

# Create .env file
echo "Creating environment configuration..."
cat > .env << EOF
DATABASE_URL=$DATABASE_URL
OPENAI_API_KEY=$OPENAI_API_KEY
PORT=$PORT
NODE_ENV=$NODE_ENV
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Build the application
echo "Building the application..."
npm run build

# Start the application
echo "Starting the application..."
echo "The application will be available at http://localhost:$PORT"
npm run start