# Conversational AI Workflow Builder Deployment Guide

This document outlines the steps required to deploy the Conversational AI Workflow Builder application on a new server. The application is a full-stack JavaScript/TypeScript application with a React frontend, Express backend, and PostgreSQL database.

## Application Components

### Technology Stack
- **Frontend**: React with TypeScript, Shadcn UI components, TailwindCSS
- **Backend**: Express.js server (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **External Services**: OpenAI API for AI-powered suggestions and assistance
- **Build Tools**: Vite, ESBuild

## Prerequisites

Before deployment, ensure the following prerequisites are met:

1. **Node.js**: Version 20 or later
2. **PostgreSQL**: Version 16 or later
3. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: Valid OpenAI API key

## Deployment Steps

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

### Database Backup

It's recommended to set up regular backups of the PostgreSQL database:

```bash
pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql
```

### Application Logs

Application logs are output to stdout/stderr and can be captured by your preferred logging solution.

## Scaling Considerations

The application can be scaled horizontally by deploying multiple instances behind a load balancer. Ensure all instances connect to the same PostgreSQL database.

## Security Considerations

1. Always use HTTPS in production
2. Keep the OpenAI API key secure
3. Implement rate limiting for public-facing APIs
4. Regularly update dependencies for security patches

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL server is running and accessible

2. **OpenAI API Issues**:
   - Verify OPENAI_API_KEY is valid
   - Check API usage limits on OpenAI dashboard

3. **Application Not Starting**:
   - Check logs for errors
   - Verify all dependencies are installed
   - Ensure required ports are available

## Support

For additional support or questions, please contact the development team.