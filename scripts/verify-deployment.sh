#!/bin/bash

# Deployment Verification Script
# This script verifies that all components of the application are working correctly
# Usage: ./verify-deployment.sh [host] [port]

set -e  # Exit immediately if a command exits with a non-zero status

# Default values
HOST=${1:-localhost}
PORT=${2:-5000}
BASE_URL="http://$HOST:$PORT"
TIMEOUT=5

echo "=============================================="
echo "Conversational AI Workflow Builder Deployment Verification"
echo "=============================================="
echo "Checking deployment at: $BASE_URL"
echo "----------------------------------------------"

# Function to check an endpoint
check_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local expected_status=${3:-200}
  local description=${4:-"API endpoint"}
  
  echo -n "Checking $description ($method $endpoint)... "
  
  local status_code
  if [ "$method" = "GET" ]; then
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$BASE_URL$endpoint")
  else
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT -X $method "$BASE_URL$endpoint")
  fi
  
  if [ "$status_code" = "$expected_status" ]; then
    echo "OK ($status_code)"
    return 0
  else
    echo "FAILED (Expected: $expected_status, Got: $status_code)"
    return 1
  fi
}

# Track overall status
overall_status=0

# Check health endpoint
check_endpoint "/api/health" "GET" "200" "Health check API"
if [ $? -ne 0 ]; then
  overall_status=1
fi

# Check use cases endpoint
check_endpoint "/api/use-cases" "GET" "200" "Use cases API"
if [ $? -ne 0 ]; then
  overall_status=1
fi

# Check settings endpoint
check_endpoint "/api/settings" "GET" "200" "Settings API"
if [ $? -ne 0 ]; then
  overall_status=1
fi

# Check frontend
echo -n "Checking frontend application... "
response=$(curl -s -L --connect-timeout $TIMEOUT "$BASE_URL")
if [[ "$response" == *"<div id=\"root\""* ]]; then
  echo "OK"
else
  echo "FAILED (Frontend not loading properly)"
  overall_status=1
fi

# Check database connection via health endpoint
echo -n "Verifying database connection... "
db_status=$(curl -s --connect-timeout $TIMEOUT "$BASE_URL/api/health" | grep -o '"status":"healthy"')
if [ -n "$db_status" ]; then
  echo "OK"
else
  echo "FAILED (Database connection issue)"
  overall_status=1
fi

# Check OpenAI configuration
echo -n "Checking OpenAI configuration... "
openai_key=$(curl -s --connect-timeout $TIMEOUT "$BASE_URL/api/settings" | grep -o "openai.apiKey")
if [ -n "$openai_key" ]; then
  echo "OK (API key setting found)"
else
  echo "WARNING (OpenAI API key setting not found)"
  # Not failing the test for this as it might be configured later
fi

echo "----------------------------------------------"
if [ $overall_status -eq 0 ]; then
  echo "✅ All checks passed! The application is deployed correctly."
else
  echo "❌ Some checks failed. Please check the logs and fix the issues."
fi
echo "=============================================="

exit $overall_status