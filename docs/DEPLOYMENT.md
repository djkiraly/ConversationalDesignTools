# Conversational AI Workflow Builder Deployment Guide

This document outlines the steps required to deploy the Conversational AI Workflow Builder application on a new server. The application is a full-stack JavaScript/TypeScript application with a React frontend, Express backend, and PostgreSQL database.

## Application Components

### Technology Stack
- **Frontend**: React with TypeScript, Shadcn UI components, TailwindCSS
- **Backend**: Express.js server (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **External Services**: OpenAI API for AI-powered suggestions and assistance
- **Build Tools**: Vite, ESBuild
- **Deployment Options**: Docker or Traditional deployment

## Prerequisites

Before deployment, ensure the following prerequisites are met:

1. **Node.js**: Version 20 or later
2. **PostgreSQL**: Version 16 or later
3. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: Valid OpenAI API key
4. **Optional Docker Requirements** (for Docker deployment):
   - Docker Engine 20+
   - Docker Compose 2.0+

## Automated Deployment (Recommended)

For the easiest deployment experience, we provide a master deployment script that automates the entire process:

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Copy and edit the environment configuration
cp .env.example .env
# Edit .env with your settings

# Run the automated deployment script
# For Docker deployment:
./scripts/master-deploy.sh --docker

# For traditional deployment:
./scripts/master-deploy.sh --manual

# To include SSL setup with a domain:
./scripts/master-deploy.sh --docker --with-ssl example.com
```

The master deployment script will:
1. Check all requirements
2. Validate environment variables
3. Set up the database if needed
4. Build and start the application
5. Configure SSL if requested
6. Verify the deployment is working

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install
```

### 2. Database Setup

```bash
# Create a PostgreSQL database
# Replace 'username', 'password', 'hostname', and 'database_name' with your values
export DATABASE_URL="postgresql://username:password@hostname:5432/database_name"

# Run database migrations to set up schema
npm run db:push
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key
```

### 4. Build the Application

```bash
# Build the frontend and backend
npm run build
```

### 5. Start the Production Server

```bash
# Start the server in production mode
npm run start
```

By default, the application will be available on port 5000. You can configure a proxy (like Nginx) to forward traffic from port 80/443 to this port.

## Docker Deployment

For containerized deployment, we provide a Docker Compose setup:

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your settings

# Start using Docker Compose
docker-compose up -d
```

The Docker setup includes:
- Node.js application container
- PostgreSQL database container
- Nginx web server container with SSL support

You can customize the Docker deployment by editing the `docker-compose.yml` file.

### SSL Configuration with Docker

To enable SSL with the Docker deployment:

```bash
# For self-signed certificates (testing only)
./scripts/setup-ssl.sh --self-signed example.com

# For Let's Encrypt certificates (production)
./scripts/setup-ssl.sh --lets-encrypt example.com

# Then restart the containers
docker-compose restart
```

## Server Requirements

### Minimum Hardware Requirements
- 1 CPU core
- 2 GB RAM
- 20 GB disk space

### Recommended Hardware Requirements
- 2+ CPU cores
- 4+ GB RAM
- 40+ GB disk space

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | None |
| `OPENAI_API_KEY` | OpenAI API key for AI functionality | Yes | None |
| `PORT` | Port to run the server on | No | 5000 |
| `NODE_ENV` | Node environment (development/production) | No | production |

## Health Check and Monitoring

The application can be monitored by checking the following endpoint:
- `GET /api/health` - Returns status 200 if the application is running correctly

## Backup and Maintenance

### Automated Maintenance Scripts

We provide several scripts to help with maintenance tasks:

#### Database Backup

For regular database backups, use the provided script:

```bash
# Run database backup (saves to ../backups by default)
./scripts/db-backup.sh

# Specify custom backup directory
./scripts/db-backup.sh /path/to/backup/dir
```

The backup script automatically:
- Creates timestamped backups
- Compresses backups to save space
- Keeps the most recent 7 backups by default
- Works in both Docker and traditional environments

#### Database Restore

To restore from a backup:

```bash
# Restore from a backup file
./scripts/db-restore.sh /path/to/backup/file.sql

# Use --force to skip confirmation prompt (be careful!)
./scripts/db-restore.sh /path/to/backup/file.sql --force
```

#### Health Checks

To verify the application is running correctly:

```bash
# Check health of local deployment
./scripts/health-check.sh

# Check health of remote deployment
./scripts/health-check.sh example.com 80
```

#### Automated Monitoring

You can set up regular health checks using cron:

```bash
# Add to crontab to check health every 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh example.com 80 >> /var/log/app-health.log 2>&1
```

### Application Logs

Application logs are output to stdout/stderr and can be captured by your preferred logging solution.

If running as a systemd service, logs can be viewed with:

```bash
# View recent logs
sudo journalctl -u conversational-ai-app -n 100

# Follow logs in real-time
sudo journalctl -u conversational-ai-app -f
```

If using Docker, logs can be viewed with:

```bash
# View recent logs
docker-compose logs --tail=100 app

# Follow logs in real-time
docker-compose logs -f app
```

## Scaling Considerations

The application can be scaled horizontally by deploying multiple instances behind a load balancer. Ensure all instances connect to the same PostgreSQL database.

## Security Considerations

### HTTPS/SSL Configuration

We provide an automated SSL setup script that supports both self-signed certificates (for testing) and Let's Encrypt certificates (for production):

```bash
# For development/testing (self-signed)
./scripts/setup-ssl.sh --self-signed example.com

# For production (Let's Encrypt)
./scripts/setup-ssl.sh --lets-encrypt example.com
```

The SSL setup script automatically:
- Generates the appropriate certificates
- Updates the Nginx configuration
- Sets up auto-renewal for Let's Encrypt certificates
- Reloads services to apply changes

### Environment Variables Protection

To keep sensitive data secure:

1. Never commit `.env` files to the repository
2. Use environment-specific `.env` files (e.g., `.env.production`, `.env.staging`)
3. Restrict file permissions on the server:
   ```bash
   sudo chown root:nodejs /opt/conversational-ai-app/.env
   sudo chmod 640 /opt/conversational-ai-app/.env
   ```

### API and Database Security

1. Keep the OpenAI API key secure
   - Regular rotation of the key is recommended
   - Monitor API usage regularly

2. Database security
   - Use strong, unique passwords
   - Restrict database connectivity to only necessary hosts
   - Enable SSL for database connections when possible

3. Application security
   - Implement rate limiting for all public-facing APIs
   - Use proper input validation for all user inputs
   - Regularly update dependencies for security patches

### Firewall and Server Hardening

We recommend basic server hardening:

```bash
# Allow only necessary ports
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Install and configure fail2ban
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
```

## Troubleshooting

### Using the Verification Script

The included verification script can help identify issues:

```bash
# Run the verification script to diagnose problems
./scripts/verify-deployment.sh
```

This script checks:
- API endpoints
- Database connectivity
- Frontend serving
- OpenAI API configuration

### Common Issues and Solutions

#### Database Connection Errors

**Symptoms**: Application fails to start, errors with "database connection refused"

**Solutions**:
- Verify DATABASE_URL is correct in your `.env` file
- Ensure PostgreSQL server is running and accessible:
  ```bash
  # Check if PostgreSQL is running
  sudo systemctl status postgresql
  
  # Start PostgreSQL if it's not running
  sudo systemctl start postgresql
  
  # Test connection directly
  psql $DATABASE_URL -c "SELECT 1"
  ```
- Check network connectivity and firewall rules if using a remote database

#### OpenAI API Issues

**Symptoms**: AI suggestions fail, errors in logs about OpenAI API

**Solutions**:
- Verify OPENAI_API_KEY is valid and properly set in your environment
  ```bash
  # Test the OpenAI API key directly
  curl -s -X POST https://api.openai.com/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}'
  ```
- Check API usage limits on the OpenAI dashboard
- Ensure your server has internet connectivity to reach the OpenAI API

#### Application Not Starting

**Symptoms**: Server won't start, or crashes shortly after starting

**Solutions**:
- Check application logs for specific errors:
  ```bash
  # If using systemd
  sudo journalctl -u conversational-ai-app -n 100
  
  # If using Docker
  docker-compose logs --tail=100 app
  ```
- Verify all dependencies are installed:
  ```bash
  npm install
  ```
- Ensure required ports are available:
  ```bash
  # Check if port 5000 is already in use
  sudo lsof -i :5000
  ```
- Verify Node.js version (should be 20+):
  ```bash
  node --version
  ```

#### SSL Certificate Issues

**Symptoms**: HTTPS not working, browser warnings, certificate errors

**Solutions**:
- For Let's Encrypt certificates, ensure your domain points to the server
- Check Certbot logs:
  ```bash
  sudo journalctl -u certbot
  ```
- Verify Nginx is properly configured:
  ```bash
  sudo nginx -t
  ```
- Manually renew certificates:
  ```bash
  sudo certbot renew --dry-run
  ```

### Getting Additional Help

If you've tried the troubleshooting steps above and still encounter issues:

1. Check the application logs for detailed error messages
2. Review the DEPLOYMENT_CHECKLIST.md file for any missed steps
3. Run the verification script with detailed output:
   ```bash
   bash -x ./scripts/verify-deployment.sh
   ```
4. Contact the development team with:
   - Error messages and logs
   - Server environment details (OS, Node.js version)
   - Steps to reproduce the issue

## Support

For additional support or questions, please contact the development team.