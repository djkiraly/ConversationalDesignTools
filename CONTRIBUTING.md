# Contributing Guide

Thank you for your interest in contributing to the Conversational AI Workflow Builder! This guide will help you set up your development environment and understand our contribution process.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 20.x or later
- **PostgreSQL**: Version 16.x or later
- **Git**: Latest version
- **IDE**: VSCode recommended with TypeScript and ESLint extensions

### Setup Steps

1. **Fork the Repository**
   
   Start by forking the repository to your own GitHub account.

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/repo-name.git
   cd repo-name
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with the following development settings:
   ```
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/conversational_ai_dev
   OPENAI_API_KEY=your_openai_api_key
   ```

5. **Set Up Local Database**
   
   Create a local PostgreSQL database for development:
   ```bash
   createdb conversational_ai_dev
   ```
   
   Push the schema to your database:
   ```bash
   npm run db:push
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Access the Application**
   
   Open your browser and navigate to [http://localhost:5000](http://localhost:5000)

## Project Structure

```
.
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and helpers
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express application
│   ├── db.ts               # Database connection and initialization
│   ├── dbStorage.ts        # Database storage implementation
│   ├── index.ts            # Server entry point
│   ├── openai.ts           # OpenAI API integration
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Storage interface definition
│   └── vite.ts             # Vite server configuration
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema and type definitions
├── scripts/                # Utility scripts for deployment and maintenance
└── .env                    # Environment variables (not committed to Git)
```

## Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Main development branch
- `feature/xxx`: Feature branches
- `bugfix/xxx`: Bug fix branches

Always create your feature or bugfix branch from `develop`.

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   
   Follow the coding standards and patterns used in the project.

3. **Update the Database Schema (if needed)**
   
   If you need to modify the database schema:
   1. Edit `shared/schema.ts` to reflect your changes
   2. Run `npm run db:push` to update your local database

4. **Run Tests**
   ```bash
   npm run check  # Type checking
   # Add other tests as appropriate
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

6. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   
   Create a pull request from your branch to the `develop` branch.

## Coding Standards

### TypeScript

- Follow TypeScript best practices
- Use explicit types rather than `any`
- Leverage type inference where appropriate

### Frontend

- Use functional components with hooks
- Use the provided UI components from Shadcn
- Follow React Query patterns for data fetching
- Keep components small and focused

### Backend

- Use the storage interface for database operations
- Validate request data with Zod schemas
- Follow RESTful API design principles
- Handle errors gracefully

### Database

- Always use Drizzle ORM for database operations
- Define schemas in `shared/schema.ts`
- Use `npm run db:push` for schema changes
- Never write raw SQL in application code (except for migrations)

## Pull Request Process

1. Ensure your code passes all tests
2. Update documentation if needed
3. Get at least one code review approval
4. Squash your commits if requested

## Additional Development Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [ReactFlow Documentation](https://reactflow.dev/docs/introduction/)
- [OpenAI API Documentation](https://platform.openai.com/docs/introduction)

Thank you for contributing to our project!