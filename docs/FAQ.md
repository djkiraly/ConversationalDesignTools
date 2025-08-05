# Frequently Asked Questions (FAQ)

This document answers common questions about installing, configuring, and using the Conversational AI Workflow Builder.

## Installation Questions

### Q: What are the minimum system requirements?

**A:** The minimum requirements are:
- **CPU**: 2 cores
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB for application, plus space for database
- **OS**: Ubuntu 20.04+, Debian 11+, macOS 11+, Windows 10/11
- **Node.js**: Version 20.x or later
- **PostgreSQL**: Version 16.x or later

### Q: Can I run the application without Docker?

**A:** Yes, you can run the application directly on your system. Follow the instructions in [INSTALLATION.md](INSTALLATION.md) for a traditional setup.

### Q: Do I need to install PostgreSQL or can I use another database?

**A:** PostgreSQL is required. The application uses PostgreSQL-specific features and Drizzle ORM with a PostgreSQL dialect. Other databases are not supported.

### Q: How do I update to a new version?

**A:** Follow the detailed instructions in [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md). Generally, you'll pull the latest code, install dependencies, rebuild the application, and run database migrations.

## Configuration Questions

### Q: What environment variables are required?

**A:** The essential environment variables are:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Valid OpenAI API key

Optional variables include:
- `PORT`: The port to run the server (default: 5000)
- `NODE_ENV`: Environment (development/production)

### Q: How do I configure SSL/HTTPS?

**A:** For production deployments, use a reverse proxy like Nginx with Let's Encrypt certificates. We provide a script to set this up:

```bash
./scripts/setup-ssl.sh --lets-encrypt yourdomain.com
```

If using Docker, update your `.env` file with your domain name and run the SSL setup script.

### Q: Can I use the application behind a corporate proxy?

**A:** Yes, but you'll need to configure the appropriate proxy settings:

```
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
NO_PROXY=localhost,127.0.0.1
```

Add these to your `.env` file or set them as environment variables.

## Database Questions

### Q: How do I backup the database?

**A:** Use the provided backup script:

```bash
./scripts/db-backup.sh /path/to/backup/directory
```

For more options, refer to [DATABASE_SETUP.md](DATABASE_SETUP.md).

### Q: What happens if the database schema changes in an update?

**A:** When you update the application, run `npm run db:push` to apply schema changes. Drizzle ORM handles this safely without data loss in most cases.

### Q: Can I use a managed PostgreSQL service instead of self-hosting?

**A:** Yes, you can use any PostgreSQL-compatible service like AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL, or Heroku Postgres. Just update your `DATABASE_URL` environment variable with the connection string provided by your service.

## OpenAI API Questions

### Q: Is an OpenAI API key required?

**A:** Yes, an OpenAI API key is required for all AI-powered features, including conversation flow suggestions, agent persona generation, and action plans. Without it, these features will be unavailable.

### Q: How much will OpenAI API usage cost?

**A:** Costs vary based on usage. Typical usage might range from $10-100 per month depending on how frequently you use AI-powered features. You can set usage limits in your OpenAI account.

### Q: Which OpenAI models does the application use?

**A:** The application primarily uses GPT-4 for complex reasoning tasks and GPT-3.5 Turbo for simpler generations. These can be configured in the settings if needed.

### Q: How do I troubleshoot OpenAI API issues?

**A:** Common issues include invalid API keys, rate limits, and quota limits. Check the application logs for specific error messages and verify your API key status in the OpenAI dashboard. See [OPENAI_SETUP.md](OPENAI_SETUP.md) for detailed troubleshooting.

## Usage Questions

### Q: How do I create my first conversation flow?

**A:** After installation:
1. Navigate to the "Use Cases" section
2. Click "New Use Case"
3. Fill in the details and save
4. Click "Edit Flow" to open the flow editor
5. Use the editor to add and connect conversation steps

For a detailed guide, see [QUICKSTART.md](QUICKSTART.md).

### Q: Can I export conversations to other systems?

**A:** Yes, you can export conversations in several formats:
- Image (PNG) of the flow diagram
- PDF documentation
- JSON format for integration with other systems

Use the Export button in the flow editor to access these options.

### Q: How many conversation steps can I create in a single flow?

**A:** There's no hard limit, but for optimal performance and usability, we recommend keeping flows under 100 steps. Very large flows may cause performance issues in the visual editor.

### Q: Can multiple users work on the same flow simultaneously?

**A:** The current version doesn't support real-time collaborative editing. Multiple users may overwrite each other's changes. We recommend coordinating access to avoid conflicts.

## Deployment Questions

### Q: Can I deploy to Kubernetes?

**A:** Yes, you can deploy to Kubernetes using the Docker container. You'll need to create appropriate Kubernetes manifests for the application and database. The Docker Compose file provides a starting point for container configuration.

### Q: How do I scale the application for more users?

**A:** For horizontal scaling:
1. Deploy multiple instances of the application behind a load balancer
2. Ensure all instances connect to the same PostgreSQL database
3. Configure session sharing if using authentication features

For vertical scaling, increase CPU and RAM allocated to the application and database containers or servers.

### Q: How do I monitor the application in production?

**A:** We recommend:
1. Use the provided health check endpoint at `/api/health`
2. Monitor server metrics (CPU, memory, disk usage)
3. Set up PostgreSQL monitoring
4. Configure log aggregation for application logs

You can also integrate with monitoring tools like Prometheus and Grafana.

## Troubleshooting

### Q: The application won't start after installation

**A:** Common issues include:
1. PostgreSQL not running or incorrectly configured
2. Invalid DATABASE_URL environment variable
3. Port 5000 already in use
4. Node.js version too old

Check the application logs for specific error messages and refer to the appropriate sections in [INSTALLATION.md](INSTALLATION.md).

### Q: Database migration fails with errors

**A:** This typically happens when:
1. The database user lacks necessary permissions
2. The database connection string is incorrect
3. There are conflicting manual changes to the database schema

Check the migration error message for details and ensure your database user has full permissions on the database.

### Q: The AI features aren't working

**A:** Verify that:
1. Your OpenAI API key is valid and correctly configured
2. Your account has sufficient credit
3. You're not hitting rate limits
4. Your application can connect to the OpenAI API (check for proxy/firewall issues)

The application logs will show specific API errors if any occur.

### Q: I'm getting "out of memory" errors

**A:** Try:
1. Increasing the Node.js memory limit:
   ```
   NODE_OPTIONS="--max-old-space-size=4096"
   ```
2. Reducing the size of complex conversation flows
3. Adding more RAM to your server/container

## Additional Support

If you can't find an answer to your question:

1. Check the detailed documentation in the project's docs directory
2. Search for similar issues in the project's issue tracker
3. Join the community forum for peer support
4. Contact the development team for commercial support options