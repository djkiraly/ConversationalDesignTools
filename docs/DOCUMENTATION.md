# Conversational AI Workflow Builder Documentation

Welcome to the documentation for the Conversational AI Workflow Builder application. This index will help you navigate the available documentation resources.

## Getting Started

- [README.md](README.md) - Project overview and basic information
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide for new users
- [FAQ.md](FAQ.md) - Frequently asked questions

## Installation and Deployment

- [INSTALLATION.md](INSTALLATION.md) - Detailed installation instructions
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - PostgreSQL database setup guide
- [OPENAI_SETUP.md](OPENAI_SETUP.md) - Setting up OpenAI API integration
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Docker-specific deployment guide
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Deployment preparation checklist
- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive deployment guide

## Maintenance and Operation

- [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) - Instructions for upgrading to new versions
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guidelines for developers

## Scripts Reference

The application comes with several utility scripts located in the `scripts/` directory:

| Script | Description |
|--------|-------------|
| `master-deploy.sh` | Orchestrates the full deployment process |
| `install-service.sh` | Installs the application as a systemd service |
| `setup-ssl.sh` | Sets up SSL certificates for HTTPS |
| `health-check.sh` | Checks the health of the application |
| `db-backup.sh` | Creates a backup of the PostgreSQL database |
| `db-restore.sh` | Restores a database from backup |
| `verify-deployment.sh` | Verifies a successful deployment |

## Environment Variables Reference

The application uses the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment (development/production) |
| `PORT` | No | 5000 | The port to run the server |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for AI features |
| `NGINX_PORT` | No | 80 | Nginx HTTP port (Docker only) |
| `NGINX_SSL_PORT` | No | 443 | Nginx HTTPS port (Docker only) |
| `DOMAIN_NAME` | No | example.com | Domain name for SSL/deployment |

## API Documentation

The application provides a RESTful API with the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/use-cases` | GET | List all use cases |
| `/api/use-cases/:id` | GET | Get a specific use case |
| `/api/use-cases` | POST | Create a new use case |
| `/api/use-cases/:id` | PATCH | Update a use case |
| `/api/use-cases/:id` | DELETE | Delete a use case |
| `/api/flow-nodes` | GET | List flow nodes |
| `/api/flow-nodes/:id` | GET | Get a specific flow node |
| `/api/settings` | GET | List application settings |
| `/api/settings/:key` | GET | Get a specific setting |
| `/api/customer-journeys` | GET | List customer journeys |
| `/api/action-plans` | GET | List action plans |

For detailed API information, test requests with tools like Postman or curl.

## Database Schema

The application uses a PostgreSQL database with the following main tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `use_cases` | Conversation use cases |
| `flow_nodes` | Nodes in the conversation flow |
| `settings` | Application settings |
| `customer_journeys` | Customer journey records |
| `customers` | Customer information |
| `action_plans` | AI-generated action plans |

The schema is managed using Drizzle ORM with definitions in `shared/schema.ts`.

## Browser Compatibility

The application is compatible with:
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## System Requirements

### For Development

- Node.js 20.x or later
- PostgreSQL 16.x or later
- 4GB RAM minimum
- Modern web browser

### For Production

- 2+ CPU cores
- 8GB+ RAM recommended
- 10GB+ disk space
- Ubuntu 20.04+ or similar OS
- PostgreSQL 16.x or later

## Security Information

- All passwords are hashed using bcrypt
- API keys are stored encrypted in the database
- HTTPS is recommended for all production deployments
- Regular security updates should be applied

## Troubleshooting Resources

If you encounter issues:

1. Check the application logs
2. Review the FAQ for common problems
3. Search for specific error messages
4. Verify your environment configuration
5. Check database connectivity
6. Restart the application if needed

## Getting Further Help

If you need additional assistance:

1. Consult the detailed documentation provided
2. Search the issue tracker for similar problems
3. Join the community discussion forums
4. Contact commercial support if available