# PostgreSQL Database Setup Guide

This guide provides detailed instructions for setting up and maintaining the PostgreSQL database required by the Conversational AI Workflow Builder.

## Database Requirements

- PostgreSQL version 16.x or later
- A dedicated database for the application
- A database user with appropriate permissions

## Local Development Setup

### Installing PostgreSQL

#### On Ubuntu/Debian:

```bash
# Update package list
sudo apt update

# Install PostgreSQL and client
sudo apt install postgresql postgresql-contrib

# Verify installation
psql --version
```

#### On macOS (using Homebrew):

```bash
# Install PostgreSQL
brew install postgresql@16

# Start the service
brew services start postgresql@16

# Verify installation
psql --version
```

#### On Windows:

1. Download the installer from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the prompts
3. Use the default port (5432)
4. Remember the password you set for the postgres user

### Creating a Database

#### Method 1: Using psql command line

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create a database
CREATE DATABASE conversational_ai_app;

# Create a user
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE conversational_ai_app TO app_user;

# Exit psql
\q
```

#### Method 2: Using pgAdmin

1. Install and open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Databases" and select "Create" → "Database"
4. Name it "conversational_ai_app"
5. Create a new user with appropriate permissions

### Configuring the Application

Update your `.env` file with the database connection details:

```
DATABASE_URL=postgresql://app_user:your_secure_password@localhost:5432/conversational_ai_app
```

For local development, your connection string might look like:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/conversational_ai_app
```

### Initializing the Database Schema

Run the database migration command to create all required tables:

```bash
npm run db:push
```

This command uses Drizzle ORM to create the database schema based on the definitions in `shared/schema.ts`.

## Production Database Setup

For production environments, you have several options:

### Option 1: Self-Hosted PostgreSQL

Follow the installation steps above, but with additional security measures:

```bash
# Create a secure database user with limited permissions
sudo -u postgres psql

# Create a production database
CREATE DATABASE conversational_ai_prod;

# Create a user with restricted permissions
CREATE USER app_prod_user WITH ENCRYPTED PASSWORD 'very_secure_password';

# Grant only necessary privileges
GRANT CONNECT ON DATABASE conversational_ai_prod TO app_prod_user;
\c conversational_ai_prod
GRANT USAGE ON SCHEMA public TO app_prod_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_prod_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_prod_user;

# Configure PostgreSQL to require passwords
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Change 'peer' to 'md5' for local connections

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Option 2: Cloud Database Services

#### AWS RDS:

1. Create an RDS PostgreSQL instance (version 16.x)
2. Configure security groups to allow connections from your application server
3. Use the provided endpoint, username, and password in your connection string

#### Google Cloud SQL:

1. Create a Cloud SQL PostgreSQL instance
2. Configure authorized networks
3. Use the provided connection details in your application

#### Azure Database for PostgreSQL:

1. Create an Azure Database for PostgreSQL server
2. Configure firewall rules to allow connections
3. Use the provided connection details in your application

### Database Connection String

For production, your connection string might look like:

```
DATABASE_URL=postgresql://username:password@hostname:5432/database_name?sslmode=require
```

Be sure to:
- Use a strong password
- Enable SSL mode for secure connections
- Restrict network access to your database server

## Database Maintenance

### Regular Backups

Use the provided backup script to create regular database backups:

```bash
# Create a backup
./scripts/db-backup.sh /path/to/backup/directory

# Automate with cron (daily at 2am)
0 2 * * * /path/to/scripts/db-backup.sh /path/to/backup/directory
```

### Restoring from Backup

If you need to restore the database from a backup:

```bash
./scripts/db-restore.sh /path/to/backup-file.sql
```

### Database Migrations

When updating the application, database schema changes will be applied automatically using:

```bash
npm run db:push
```

This is a safe operation that preserves existing data while updating the schema.

## Monitoring Database Health

### Check Database Size

```bash
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('conversational_ai_app'));"
```

### Check Connection Count

```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'conversational_ai_app';"
```

### Check for Long-Running Queries

```bash
sudo -u postgres psql -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';"
```

## Troubleshooting Common Issues

### Connection Refused

If you see "connection refused" errors:

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check PostgreSQL is listening on the expected port:
   ```bash
   sudo netstat -tulpn | grep 5432
   ```

3. Verify firewall settings:
   ```bash
   sudo ufw status
   ```

### Authentication Failed

If you see "authentication failed" errors:

1. Verify the username and password in your connection string
2. Check the user has appropriate permissions
3. Verify PostgreSQL's authentication configuration in pg_hba.conf

### Database Doesn't Exist

If you see "database does not exist" errors:

1. Connect to PostgreSQL and verify the database exists:
   ```bash
   sudo -u postgres psql -l
   ```

2. Create the database if needed:
   ```bash
   sudo -u postgres createdb conversational_ai_app
   ```

## Best Practices

1. **Regular Backups**: Implement automated daily backups
2. **Database Updates**: Always run migrations when updating the application
3. **Performance**: Monitor database size and query performance
4. **Security**: Use strong passwords and restrict network access
5. **SSL**: Enable SSL for all production database connections