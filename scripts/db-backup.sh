#!/bin/bash

# Database Backup Script
# This script creates a backup of the PostgreSQL database and stores it with a timestamp
# Usage: ./db-backup.sh [backup_dir]

set -e  # Exit immediately if a command exits with a non-zero status

# Default values
BACKUP_DIR=${1:-"../backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if we're running inside docker
if [ -f /.dockerenv ]; then
    echo "Running in Docker environment..."
    # Use environment variables from docker-compose
    if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
        echo "Error: Database environment variables not set"
        echo "Make sure POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB are set"
        exit 1
    fi
    
    # Create backup
    echo "Creating database backup to $BACKUP_FILE..."
    pg_dump -h postgres -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE
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
    
    # Create backup
    echo "Creating database backup to $BACKUP_FILE..."
    PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE
fi

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully!"
    echo "Backup file: $BACKUP_FILE"
    echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "Backup failed!"
    exit 1
fi

# Optional: Compress the backup
gzip $BACKUP_FILE
if [ $? -eq 0 ]; then
    echo "Backup compressed successfully!"
    echo "Compressed file: $BACKUP_FILE.gz"
    echo "Compressed size: $(du -h $BACKUP_FILE.gz | cut -f1)"
fi

# List all backups and their sizes
echo -e "\nAll available backups:"
ls -lh $BACKUP_DIR | grep -v "^d" | awk '{print $9 " (" $5 ")"}'

# Optional: Cleanup old backups (keep last 7 backups)
backup_count=$(ls -1 $BACKUP_DIR | wc -l)
if [ $backup_count -gt 7 ]; then
    echo -e "\nRemoving old backups (keeping last 7)..."
    ls -1t $BACKUP_DIR | tail -n +8 | xargs -I {} rm $BACKUP_DIR/{}
    echo "Old backups removed."
fi