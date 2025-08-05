#!/bin/bash

# Database Restore Script
# This script restores a PostgreSQL database from a backup file
# Usage: ./db-restore.sh <backup_file> [--force]

set -e  # Exit immediately if a command exits with a non-zero status

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Error: No backup file specified"
    echo "Usage: $0 <backup_file> [--force]"
    exit 1
fi

BACKUP_FILE=$1
FORCE_RESTORE=$2

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Check if it might be gzipped
    if [ -f "$BACKUP_FILE.gz" ]; then
        echo "Found compressed backup file: $BACKUP_FILE.gz"
        echo "Decompressing..."
        gunzip -k "$BACKUP_FILE.gz"
        if [ ! -f "$BACKUP_FILE" ]; then
            echo "Error: Failed to decompress backup file"
            exit 1
        fi
    else
        echo "Error: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Warning about data loss
if [ "$FORCE_RESTORE" != "--force" ]; then
    echo "WARNING: This will overwrite the current database with the backup data."
    echo "All current data will be lost and replaced with the data from the backup."
    echo ""
    read -p "Are you sure you want to continue? (y/n): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Restore canceled."
        exit 0
    fi
fi

# Check if we're running inside docker
if [ -f /.dockerenv ]; then
    echo "Running in Docker environment..."
    # Use environment variables from docker-compose
    if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
        echo "Error: Database environment variables not set"
        echo "Make sure POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB are set"
        exit 1
    fi
    
    # Restore backup
    echo "Restoring database from $BACKUP_FILE..."
    cat $BACKUP_FILE | psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB
else
    # Running on host machine, use DATABASE_URL if available
    if [ -z "$DATABASE_URL" ]; then
        # Try to load from .env file if it exists
        if [ -f ../.env ]; then
            source ../.env
        fi
        
        if [ -z "$DATABASE_URL" ]; then
            echo "Error: DATABASE_URL not set"
            echo "Please set DATABASE_URL environment variable or provide it in .env file"
            exit 1
        fi
    fi
    
    # Extract connection parameters from DATABASE_URL
    # Expected format: postgresql://username:password@hostname:5432/database_name
    DB_USER=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/\([^:]*\):.*$/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^:]*:\([^@]*\)@.*$/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^@]*@\([^:]*\):.*$/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:\([^/]*\)\/.*$/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/^postgresql:\/\/[^/]*\/\(.*\)$/\1/p')
    
    # Restore backup
    echo "Restoring database from $BACKUP_FILE..."
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "Restore completed successfully!"
else
    echo "Restore failed!"
    exit 1
fi