# Docker Deployment Guide

This guide provides detailed instructions for deploying the Conversational AI Workflow Builder using Docker, which simplifies setup and ensures consistent environments across different installations.

## Prerequisites

Before you begin, ensure you have the following installed:

- Docker Engine 20.10 or later
- Docker Compose 2.0 or later
- Git (to clone the repository)
- A valid OpenAI API key
- 2GB+ of free memory for containers
- 10GB+ of free disk space

## Quick Start

For a simple deployment with default settings:

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Set up environment variables
cp .env.example .env
# Edit .env with your settings (especially DATABASE_URL and OPENAI_API_KEY)

# Start the containers
docker-compose up -d

# The application will be available at http://localhost:5000
```

## Detailed Deployment Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with appropriate values:

```
# Application Configuration
NODE_ENV=production
PORT=5000

# Database Configuration (for Docker deployment)
DATABASE_URL=postgresql://postgres:postgres@db:5432/conversational_ai_app

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Docker Specific Configuration
NGINX_PORT=80
NGINX_SSL_PORT=443
DOMAIN_NAME=example.com
```

### 3. Customize Docker Compose Configuration (Optional)

If needed, you can customize the `docker-compose.yml` file to:
- Change exposed ports
- Adjust resource limits
- Configure volume mappings
- Add custom networks

### 4. Build and Start the Containers

```bash
# Build and start in detached mode
docker-compose up -d

# To see the build and startup logs
docker-compose up
```

### 5. Wait for Initialization

The first start may take a few minutes as it:
1. Builds the application
2. Sets up the PostgreSQL database
3. Runs initial migrations
4. Seeds default data

You can monitor the logs during this process:

```bash
docker-compose logs -f app
```

### 6. Verify the Deployment

Check that all containers are running:

```bash
docker-compose ps
```

Verify the application is working:

```bash
# Using the health check script
./scripts/health-check.sh localhost 5000

# Or using curl
curl http://localhost:5000/api/health
```

## Understanding the Docker Setup

The Docker deployment consists of the following containers:

### Application Container (`app`)

- Runs the Node.js application
- Built from the project source code
- Connects to the database container
- Exposes port 5000 internally

### Database Container (`db`)

- Runs PostgreSQL 16
- Stores all application data
- Persists data in a Docker volume

### Nginx Container (`nginx`, Optional)

- Acts as a reverse proxy
- Handles SSL termination
- Provides caching and compression
- Exposes ports 80 and 443 to the outside world

## Production Deployment Considerations

### Setting Up SSL

For a production deployment, you should enable HTTPS:

1. Ensure you have a domain pointing to your server

2. Update the `.env` file with your domain:
   ```
   DOMAIN_NAME=yourdomain.com
   ```

3. Run the SSL setup script:
   ```bash
   ./scripts/setup-ssl.sh --lets-encrypt yourdomain.com
   ```

4. Restart the Nginx container:
   ```bash
   docker-compose restart nginx
   ```

### Database Persistence

The default setup uses a Docker volume for database persistence. For production, consider:

1. Using a host-mounted volume for easier backups:
   ```yaml
   volumes:
     - ./pgdata:/var/lib/postgresql/data
   ```

2. Or using an external PostgreSQL database:
   ```
   DATABASE_URL=postgresql://username:password@your-external-db-host:5432/database_name
   ```

### Container Resource Limits

For production, set resource limits in your docker-compose.yml:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
  
  db:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 512M
```

### Logging Configuration

For production, configure proper logging:

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Managing the Docker Deployment

### Viewing Logs

```bash
# View logs from all containers
docker-compose logs

# View logs from a specific container
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app
```

### Stopping the Application

```bash
docker-compose down
```

### Restarting Containers

```bash
# Restart all containers
docker-compose restart

# Restart a specific container
docker-compose restart app
```

### Updating the Application

```bash
# Pull the latest code
git pull

# Rebuild and restart containers
docker-compose up -d --build
```

### Database Backups

```bash
# Create a backup
docker-compose exec db pg_dump -U postgres -d conversational_ai_app > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T db psql -U postgres -d conversational_ai_app
```

## Monitoring and Maintenance

### Container Health Monitoring

```bash
# Check container status
docker-compose ps

# Check container resource usage
docker stats
```

### Database Management

```bash
# Connect to the database
docker-compose exec db psql -U postgres -d conversational_ai_app

# Run database operations
docker-compose exec app npm run db:push
```

### Application Maintenance

```bash
# Execute commands in the app container
docker-compose exec app npm run check

# Update dependencies
docker-compose exec app npm install
```

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check for errors in the logs
docker-compose logs app

# Verify environment variables
docker-compose config
```

#### Database Connection Issues

```bash
# Check if the database container is running
docker-compose ps db

# Verify database initialization
docker-compose logs db

# Test database connection from the app container
docker-compose exec app npx drizzle-kit ping
```

#### Permission Problems

```bash
# Check file permissions in volumes
ls -la ./volumes

# Fix permissions if needed
chmod -R 755 ./volumes
```

#### Memory Issues

```bash
# Check memory usage
docker stats

# Increase container memory limits in docker-compose.yml
```

## Advanced Configuration

### Custom Nginx Configuration

To customize the Nginx configuration:

1. Create a custom config file:
   ```bash
   cp nginx/default.conf nginx/custom.conf
   ```

2. Edit the custom config file as needed

3. Update the docker-compose.yml to use your custom config:
   ```yaml
   volumes:
     - ./nginx/custom.conf:/etc/nginx/conf.d/default.conf
   ```

### Multiple Environments

For managing multiple environments:

1. Create environment-specific .env files:
   ```bash
   # Development
   cp .env.example .env.dev
   
   # Staging
   cp .env.example .env.staging
   
   # Production
   cp .env.example .env.prod
   ```

2. Use the appropriate file when starting containers:
   ```bash
   # For development
   docker-compose --env-file .env.dev up -d
   
   # For staging
   docker-compose --env-file .env.staging up -d
   
   # For production
   docker-compose --env-file .env.prod up -d
   ```

## Security Best Practices

1. **Never expose the database port** to the public internet
2. **Use strong passwords** for the database
3. **Enable HTTPS** for all production deployments
4. **Regularly update** the Docker images and dependencies
5. **Implement rate limiting** in Nginx for production deployments
6. **Configure a firewall** to restrict access to necessary ports only