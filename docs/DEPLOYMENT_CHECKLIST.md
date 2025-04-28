# Conversational AI Workflow Builder - Deployment Checklist

This checklist provides a step-by-step guide for deploying the Conversational AI Workflow Builder application to a production environment.

## Pre-Deployment Checklist

- [ ] Obtain a PostgreSQL database
  - Cloud-hosted option (e.g., AWS RDS, Google Cloud SQL, Azure Database) 
  - OR self-hosted PostgreSQL server (v16+)
- [ ] Set up a valid OpenAI API key
- [ ] Provision a server with adequate resources
  - Recommended: 2+ CPU cores, 4+ GB RAM
  - Operating system: Ubuntu 20.04 LTS or newer
- [ ] Ensure Node.js 20+ is installed on the server
- [ ] Prepare domain name (optional but recommended)
- [ ] Prepare SSL certificate (optional but recommended for production)

## Deployment Options

Choose one of the following deployment methods:

### Option 1: Manual Deployment (Using Provided Scripts)

1. [ ] Clone the repository
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. [ ] Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. [ ] Run the deployment script
   ```bash
   ./deploy.sh --database-url <db-url> --openai-key <api-key>
   ```

4. [ ] Install as a systemd service (optional)
   ```bash
   sudo scripts/install-service.sh
   sudo systemctl enable --now conversational-ai-app
   ```

5. [ ] Set up SSL (optional but recommended)
   ```bash
   sudo scripts/setup-ssl.sh --lets-encrypt <your-domain>
   ```

### Option 2: Docker Deployment

1. [ ] Clone the repository
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. [ ] Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. [ ] Build and run with Docker Compose
   ```bash
   docker-compose up -d
   ```

4. [ ] Check if the application is running properly
   ```bash
   ./scripts/health-check.sh localhost 5000
   ```

5. [ ] Set up Nginx and SSL (optional but recommended)
   - Uncomment SSL configuration in nginx/default.conf
   - Use scripts/setup-ssl.sh to obtain SSL certificates

## Post-Deployment Checklist

- [ ] Verify application is running properly
  ```bash
  curl http://localhost:5000/api/health
  ```

- [ ] Set up regular database backups
  ```bash
  # Add to crontab to run daily at 2 AM
  0 2 * * * /opt/conversational-ai-app/scripts/db-backup.sh /path/to/backup/dir
  ```

- [ ] Configure monitoring (optional)
  - Set up health check monitoring with your preferred monitoring tool
  - Point it to the /api/health endpoint

- [ ] Set up log rotation
  ```bash
  # If using systemd
  sudo nano /etc/logrotate.d/conversational-ai-app
  ```

## Security Checklist

- [ ] Ensure database credentials are secure
- [ ] Verify all environment variables are properly set
- [ ] Use HTTPS for all production traffic
- [ ] Implement proper firewall rules
  ```bash
  # Allow only necessary ports
  sudo ufw allow ssh
  sudo ufw allow http
  sudo ufw allow https
  sudo ufw enable
  ```

- [ ] Set up fail2ban for SSH (optional)
  ```bash
  sudo apt install fail2ban
  sudo systemctl enable --now fail2ban
  ```

## Maintenance Procedures

### Database Backup

```bash
./scripts/db-backup.sh /path/to/backup/dir
```

### Database Restore

```bash
./scripts/db-restore.sh /path/to/backup/file.sql
```

### Updating the Application

```bash
# Stop the service
sudo systemctl stop conversational-ai-app

# Pull the latest changes
git pull

# Install dependencies and build
npm install
npm run build

# Run migrations
npm run db:push

# Start the service
sudo systemctl start conversational-ai-app
```

## Troubleshooting

If you encounter issues during deployment:

1. Check the application logs:
   ```bash
   # If using systemd
   sudo journalctl -u conversational-ai-app -f
   
   # If using Docker
   docker-compose logs -f app
   ```

2. Verify environment variables are set correctly
3. Check database connectivity
4. Ensure PostgreSQL is running and accessible
5. Validate the OpenAI API key
6. Check for network connectivity issues

For more detailed deployment information, refer to the [DEPLOYMENT.md](DEPLOYMENT.md) document.