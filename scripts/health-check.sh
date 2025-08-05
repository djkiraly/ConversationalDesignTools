#!/bin/bash

# Health Check Script
# This script checks if the application is running properly
# Usage: ./health-check.sh <host> [port]

HOST=${1:-localhost}
PORT=${2:-5000}
TIMEOUT=5
HEALTH_ENDPOINT="/api/health"
MAX_RETRIES=3

echo "Checking health of application at $HOST:$PORT$HEALTH_ENDPOINT"

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i of $MAX_RETRIES..."
  
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "http://$HOST:$PORT$HEALTH_ENDPOINT")
  
  if [ "$RESPONSE" = "200" ]; then
    echo "Health check passed! Application is running properly."
    exit 0
  else
    echo "Health check failed with status code: $RESPONSE"
    if [ "$i" -lt "$MAX_RETRIES" ]; then
      echo "Waiting before next retry..."
      sleep 3
    fi
  fi
done

echo "Health check failed after $MAX_RETRIES attempts."
exit 1