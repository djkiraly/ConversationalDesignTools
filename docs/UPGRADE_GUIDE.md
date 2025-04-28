# Upgrade Guide

This document provides instructions for upgrading your Conversational AI Workflow Builder installation to newer versions while ensuring minimal downtime and preserving your data.

## Before You Upgrade

### 1. Backup Your Data

Always create a backup of your database before upgrading:

```bash
# Using the provided backup script
./scripts/db-backup.sh /path/to/backup/directory

# Or directly with pg_dump
pg_dump -U your_username -d your_database_name > pre_upgrade_backup.sql
```

### 2. Review the Changelog

Check the changelog or release notes to understand what has changed in the new version:
- New features
- Breaking changes
- Database schema changes
- Configuration changes

### 3. Check System Requirements

Verify that your environment meets the requirements for the new version:
- Node.js version
- PostgreSQL version
- Available disk space
- Required environment variables

## Upgrade Process

### Standard Upgrade (Non-Docker)

Follow these steps to upgrade your installation:

#### 1. Stop the Application

If running as a systemd service:
```bash
sudo systemctl stop conversational-ai-app
```

If running directly:
```bash
# Find the process
ps aux | grep node
# Kill the process
kill <process_id>
```

#### 2. Backup Configuration

```bash
cp .env .env.backup
```

#### 3. Update the Codebase

```bash
# Navigate to your application directory
cd /path/to/application

# If using Git
git fetch --all
git checkout v2.x.x  # Replace with the version you're upgrading to

# If not using Git, you may need to download the new version and replace files
```

#### 4. Update Dependencies

```bash
npm install
```

#### 5. Build the Application

```bash
npm run build
```

#### 6. Update Database Schema

```bash
npm run db:push
```

#### 7. Update Configuration

Check if any new environment variables are required:
```bash
# Compare your current .env file with the example
diff .env .env.example
```

Add any new required variables to your .env file.

#### 8. Start the Application

If running as a systemd service:
```bash
sudo systemctl start conversational-ai-app
```

If running directly:
```bash
npm start
```

#### 9. Verify the Upgrade

- Check the application logs for any errors
- Verify that the application is running correctly
- Test key features to ensure they work as expected

### Docker Upgrade

If you're using Docker, the upgrade process is simpler:

#### 1. Pull the Latest Image

```bash
# If using Docker Compose
docker-compose pull

# If using Docker directly
docker pull your-image:latest
```

#### 2. Backup Configuration and Data

```bash
cp .env .env.backup
./scripts/db-backup.sh /path/to/backup/directory
```

#### 3. Update Docker Compose File

If the new version requires changes to the docker-compose.yml file, update it accordingly.

#### 4. Restart the Containers

```bash
docker-compose down
docker-compose up -d
```

#### 5. Run Database Migrations

```bash
docker-compose exec app npm run db:push
```

#### 6. Verify the Upgrade

Monitor the logs and test the application:
```bash
docker-compose logs -f app
```

## Version-Specific Upgrade Notes

### Upgrading from v1.x to v2.x

* New required environment variables:
  * `NODE_OPTIONS="--max-old-space-size=4096"` for improved performance
  * `OPENAI_MODEL=gpt-4` to specify the default model

* Database schema changes:
  * New tables for action plans
  * Extended user schema
  * Run `npm run db:push` to apply these changes safely

* Configuration changes:
  * Updated Nginx configuration if using Docker

### Upgrading from v2.x to v3.x

* System requirements changes:
  * Node.js 20.x or later required
  * PostgreSQL 16.x or later required

* New features:
  * Enhanced AI capabilities
  * Improved export options
  * Advanced workflow visualization

* Required manual steps:
  * Update OpenAI API integration for compatibility with new models
  * Review existing agent personas for compatibility with new AI models

## Downgrading (Rollback)

If you encounter issues after upgrading, you can roll back to the previous version:

### 1. Stop the Application

```bash
sudo systemctl stop conversational-ai-app
# or
docker-compose down
```

### 2. Restore the Previous Codebase

```bash
git checkout v1.x.x  # Replace with the previous version
# or
# Restore from backup
```

### 3. Restore the Database

```bash
./scripts/db-restore.sh /path/to/pre_upgrade_backup.sql
```

### 4. Restore Configuration

```bash
cp .env.backup .env
```

### 5. Rebuild and Restart

```bash
npm install
npm run build
sudo systemctl start conversational-ai-app
# or
docker-compose up -d
```

## Common Upgrade Issues

### Database Migration Failures

If you encounter database migration issues:

1. Check the error message for specific details
2. Verify database user permissions
3. Restore from backup if needed
4. Contact support with the specific error message

### Application Won't Start After Upgrade

If the application fails to start:

1. Check logs for error messages
2. Verify environment variables are correct
3. Ensure all dependencies were installed correctly
4. Check for port conflicts

### Performance Issues After Upgrade

If you notice performance degradation:

1. Check server resource usage (CPU, memory)
2. Review database query performance
3. Adjust Node.js memory settings if needed
4. Optimize PostgreSQL configuration

## Staying Updated

To stay informed about new releases and updates:

1. Subscribe to the project's mailing list or newsletter
2. Follow the project on GitHub
3. Join the community forum or discussion group
4. Check the official website regularly for announcements