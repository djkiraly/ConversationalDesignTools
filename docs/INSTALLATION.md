# Detailed Installation Guide

This guide provides comprehensive instructions for installing and configuring the Conversational AI Workflow Builder in different environments.

## Table of Contents

1. [Local Development Environment](#local-development-environment)
2. [Production Server Installation](#production-server-installation)
3. [Docker Installation](#docker-installation)
4. [Cloud Platform Deployments](#cloud-platform-deployments)
5. [Troubleshooting](#troubleshooting)

---

## Local Development Environment

### System Requirements

- **Operating System**: Windows 10/11, macOS 11+, or Ubuntu 20.04+
- **Node.js**: Version 20.x or later
- **PostgreSQL**: Version 16.x or later
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB minimum for application and dependencies

### Step-by-Step Installation

1. **Install Node.js and npm**
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Install PostgreSQL**
   - Download and install from [postgresql.org](https://www.postgresql.org/download/)
   - Create a database for the application
   - Note your connection credentials

3. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

4. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with the following required parameters:
   ```
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
   OPENAI_API_KEY=your_openai_api_key
   ```

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Set Up Database Schema**
   ```bash
   npm run db:push
   ```

7. **Start Development Server**
   ```bash
   npm run dev
   ```

8. **Access the Application**
   - Open your browser and navigate to [http://localhost:5000](http://localhost:5000)

---

## Production Server Installation

### System Requirements

- **Operating System**: Ubuntu 20.04+ or Debian 11+ recommended
- **Node.js**: Version 20.x LTS
- **PostgreSQL**: Version 16.x
- **RAM**: 8GB minimum, 16GB recommended for production workloads
- **CPU**: 2+ cores recommended
- **Disk Space**: 10GB+ recommended for the application, logs, and database

### Step-by-Step Installation

1. **Update System Packages**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install PostgreSQL**
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   ```

4. **Configure PostgreSQL**
   ```bash
   sudo -u postgres psql
   
   # In PostgreSQL prompt
   CREATE DATABASE conversational_ai_app;
   CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE conversational_ai_app TO app_user;
   \q
   ```

5. **Install Application**
   ```bash
   # Create directory for the application
   sudo mkdir -p /opt/conversational-ai-app
   sudo chown $USER:$USER /opt/conversational-ai-app
   
   # Clone repository
   git clone <repository-url> /opt/conversational-ai-app
   cd /opt/conversational-ai-app
   ```

6. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with production settings:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://app_user:your_secure_password@localhost:5432/conversational_ai_app
   OPENAI_API_KEY=your_openai_api_key
   ```

7. **Install Dependencies and Build**
   ```bash
   npm install
   npm run build
   ```

8. **Set Up Database Schema**
   ```bash
   npm run db:push
   ```

9. **Install as System Service**
   ```bash
   sudo ./scripts/install-service.sh
   sudo systemctl enable conversational-ai-app
   sudo systemctl start conversational-ai-app
   ```

10. **Verify Service Status**
    ```bash
    sudo systemctl status conversational-ai-app
    ```

11. **Set Up Reverse Proxy (Optional, but recommended)**
    
    Using Nginx:
    ```bash
    sudo apt install -y nginx
    
    # Create Nginx configuration
    sudo nano /etc/nginx/sites-available/conversational-ai-app
    ```
    
    Add the following configuration:
    ```
    server {
        listen 80;
        server_name your_domain.com;
        
        location / {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    
    Enable the site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/conversational-ai-app /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    ```

12. **Set Up SSL (Recommended)**
    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d your_domain.com
    ```

---

## Docker Installation

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Step-by-Step Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your settings:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@db:5432/conversational_ai_app
   OPENAI_API_KEY=your_openai_api_key
   
   # Docker specific
   NGINX_PORT=80
   NGINX_SSL_PORT=443
   DOMAIN_NAME=your_domain.com
   ```

3. **Start Docker Containers**
   ```bash
   docker-compose up -d
   ```

4. **Verify Deployment**
   ```bash
   docker-compose ps
   ```

5. **Access Logs**
   ```bash
   docker-compose logs -f app
   ```

6. **Set Up SSL (If needed)**
   ```bash
   ./scripts/setup-ssl.sh --lets-encrypt your_domain.com
   docker-compose restart nginx
   ```

---

## Cloud Platform Deployments

### AWS Deployment

1. **EC2 Deployment**
   - Launch an EC2 instance (t3.small or larger recommended)
   - Follow the "Production Server Installation" instructions above

2. **AWS ECS with Fargate**
   - Use the provided Docker configuration
   - Create a task definition based on the docker-compose.yml
   - Deploy as a service in your ECS cluster

### Google Cloud Platform

1. **Compute Engine**
   - Launch a VM instance (e2-standard-2 or larger recommended)
   - Follow the "Production Server Installation" instructions above

2. **Google Kubernetes Engine**
   - Use the provided Docker configuration
   - Create Kubernetes deployment manifests
   - Deploy to your GKE cluster

### Microsoft Azure

1. **Azure VM**
   - Create a VM (Standard_B2s or larger recommended)
   - Follow the "Production Server Installation" instructions above

2. **Azure App Service**
   - Create a Web App for Containers
   - Use the Docker image from the project
   - Configure environment variables in the Application Settings

---

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

**Problem**: Application fails to connect to the database
**Solutions**:
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check DATABASE_URL in .env file
3. Ensure the database user has proper permissions
4. Test connection manually: `psql $DATABASE_URL`

#### Application Won't Start

**Problem**: Service fails to start or crashes immediately
**Solutions**:
1. Check application logs: `sudo journalctl -u conversational-ai-app -n 100`
2. Verify all required environment variables are set
3. Check for port conflicts: `sudo netstat -tulpn | grep 5000`
4. Ensure Node.js version is compatible: `node --version`

#### OpenAI API Issues

**Problem**: AI features not working
**Solutions**:
1. Verify OPENAI_API_KEY in .env file
2. Check OpenAI API status: [status.openai.com](https://status.openai.com/)
3. Verify API key has sufficient quota/credits
4. Check application logs for specific API error messages

#### SSL Certificate Issues

**Problem**: SSL certificate not working or expired
**Solutions**:
1. Renew Let's Encrypt certificate: `sudo certbot renew`
2. Check certificate status: `sudo certbot certificates`
3. Verify Nginx configuration: `sudo nginx -t`
4. Restart Nginx: `sudo systemctl restart nginx`

### Getting Additional Help

If you're experiencing issues not covered here:

1. Check the full application logs
2. Consult the project's issue tracker for similar problems
3. Contact the development team with detailed information about your issue, including:
   - Error messages
   - Environment details (OS, Node.js version, etc.)
   - Steps to reproduce the issue