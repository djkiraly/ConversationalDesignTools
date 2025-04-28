# Conversational AI Workflow Builder

A sophisticated web application for designing, visualizing, and managing conversational AI workflows with advanced AI-assisted editing and intelligent interaction modeling capabilities.

## Features

- Interactive flow visualization with ReactFlow
- AI-powered workflow suggestion and editing
- OpenAI integration for workflow optimization
- Real-time collaborative workflow editing
- Persistent agent persona configuration
- Enhanced export functionality with PNG image generation
- Detailed use case management with comprehensive field tracking

## Technology Stack

- **Frontend**: React with TypeScript, Shadcn UI components, TailwindCSS
- **Backend**: Express.js server (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **External Services**: OpenAI API for AI-powered suggestions
- **Build Tools**: Vite, ESBuild

## Prerequisites

Before installation, ensure you have:

- **Node.js**: Version 20.x or later
- **PostgreSQL**: Version 16.x or later
- **OpenAI API Key**: For AI-powered suggestions and assistance

## Quick Start Guide

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the file with your settings
# Required: DATABASE_URL, OPENAI_API_KEY
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up the Database

```bash
# Push the schema to your PostgreSQL database
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:5000](http://localhost:5000)

## Production Deployment

### Option 1: Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. (Optional) Install as a systemd service:
   ```bash
   sudo ./scripts/install-service.sh
   sudo systemctl enable --now conversational-ai-app
   ```

### Option 2: Automated Deployment Script

We provide a master deployment script that automates the entire process:

```bash
# For standard deployment:
./scripts/master-deploy.sh --manual

# For Docker-based deployment:
./scripts/master-deploy.sh --docker

# With SSL:
./scripts/master-deploy.sh --manual --with-ssl yourdomain.com
```

### Option 3: Docker Deployment

If you prefer to use Docker:

1. Make sure Docker and Docker Compose are installed
2. Set up your environment variables in .env
3. Run:
   ```bash
   docker-compose up -d
   ```

## Database Management

### Migrations

Always push schema changes using the Drizzle ORM migration tool:

```bash
npm run db:push
```

### Backup and Restore

We provide scripts for database backup and restore operations:

```bash
# Create a backup
./scripts/db-backup.sh

# Restore from backup
./scripts/db-restore.sh backup-file.sql
```

## Monitoring and Health Checks

You can monitor the application using the provided health check script:

```bash
# Check health of local deployment
./scripts/health-check.sh

# Check health of remote deployment
./scripts/health-check.sh example.com 80
```

## SSL Configuration

We provide an automated SSL setup script that supports both self-signed certificates (for testing) and Let's Encrypt certificates (for production):

```bash
# For development/testing (self-signed)
./scripts/setup-ssl.sh --self-signed example.com

# For production (Let's Encrypt)
./scripts/setup-ssl.sh --lets-encrypt example.com
```

## Application Logs

Logs can be viewed in different ways depending on how you deployed the application:

### Systemd Service

```bash
# View recent logs
sudo journalctl -u conversational-ai-app -n 100

# Follow logs in real-time
sudo journalctl -u conversational-ai-app -f
```

### Docker

```bash
# View recent logs
docker-compose logs --tail=100 app

# Follow logs in real-time
docker-compose logs -f app
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify your PostgreSQL server is running
   - Check that the DATABASE_URL in your .env file is correct
   - Ensure the database user has necessary permissions

2. **OpenAI API Issues**:
   - Verify your OPENAI_API_KEY in the .env file
   - Check your API usage quota on the OpenAI dashboard

3. **Port Conflicts**:
   - If port 5000 is already in use, you can change the PORT in your .env file

### Getting Help

For additional assistance or to report issues, please contact the development team or submit an issue through the project's issue tracker.

## Development Guidelines

- Follow modern web application patterns and best practices
- Focus on frontend functionality, with backend primarily for data persistence and API calls
- Use TypeScript for all new code
- Follow the established data model in `shared/schema.ts`
- Update the database schema through Drizzle ORM

## License

This project is licensed under the MIT License - see the LICENSE file for details.