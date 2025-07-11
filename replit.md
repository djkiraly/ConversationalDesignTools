# Conversational AI Workflow Builder

## Overview

This is a sophisticated web application for designing, visualizing, and managing conversational AI workflows. The system provides AI-assisted editing capabilities, interactive flow visualization, and comprehensive workflow management with OpenAI integration for intelligent suggestions and optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with a clear separation between client and server components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern React features
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with TailwindCSS for styling
- **Flow Visualization**: ReactFlow for interactive workflow diagrams and node-based editing

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for type safety across the stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Build**: ESBuild for server-side bundling and compilation

## Key Components

### Database Layer
- **Primary Database**: PostgreSQL (version 16+) for persistent data storage
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema Management**: Centralized schema definitions in `shared/schema.ts` with automatic migrations
- **Connection**: Connection pooling via pg (node-postgres) library

### AI Integration
- **Primary AI Service**: OpenAI API for generating workflow suggestions, agent personas, and conversation flows
- **Backup AI Service**: Google Generative AI (@google/genai) as alternative AI provider
- **AI Features**: 
  - Use case suggestion and optimization
  - Agent persona generation
  - Conversation flow recommendations
  - Journey summarization and analysis

### Data Models
The application manages several core entities:
- **Use Cases**: Complete workflow definitions with metadata, problem statements, and solutions
- **Flow Nodes**: Individual workflow steps with positioning and connection data
- **Customer Journeys**: User experience mapping and journey visualization
- **Agent Journeys**: AI agent behavior patterns and conversation flows
- **Action Plans**: Structured plans derived from use cases and journeys
- **Customers**: Customer profile management
- **Settings**: Application configuration including API keys and system prompts

### Visualization Engine
- **ReactFlow Integration**: Interactive node-based workflow visualization
- **Node Types**: Multiple specialized node types (Agent, Decision, System, Escalation, Guardrail)
- **Auto-sizing**: Dynamic node sizing based on content
- **Export Capabilities**: PNG image and Word document generation for workflows

## Data Flow

### Client-Server Communication
1. **API Layer**: RESTful API endpoints for all CRUD operations
2. **Query Management**: TanStack Query handles caching, background updates, and optimistic updates
3. **Form Handling**: React Hook Form with Zod validation for type-safe form processing
4. **Real-time Updates**: Mutation-based updates with automatic cache invalidation

### AI Workflow Integration
1. **User Input**: Users provide use case details or workflow requirements
2. **AI Processing**: OpenAI API processes input and generates suggestions
3. **User Review**: Generated suggestions are presented for user approval
4. **Data Persistence**: Approved suggestions are saved to PostgreSQL database
5. **Visualization**: Updated data is reflected in ReactFlow diagrams

### File Export Pipeline
1. **Data Preparation**: Workflow data is formatted for export
2. **Image Generation**: html2canvas captures visual representations
3. **Document Assembly**: Word documents are generated using docx library
4. **Download Delivery**: Files are provided as downloadable content

## External Dependencies

### Required Services
- **OpenAI API**: Required for AI-powered features (key stored in environment variables)
- **PostgreSQL Database**: Required for data persistence (connection via DATABASE_URL)

### Optional Services
- **Google Generative AI**: Alternative AI provider for enhanced functionality

### Development Dependencies
- **Node.js**: Version 20.x or later for runtime compatibility
- **Package Manager**: npm for dependency management

## Deployment Strategy

### Environment Configuration
The application supports multiple deployment modes:

1. **Development Mode**: Local development with hot reloading via Vite
2. **Production Mode**: Optimized builds with static asset serving
3. **Docker Deployment**: Containerized deployment with Docker Compose

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 5000)

### Build Process
1. **Client Build**: Vite builds React application to `dist/public`
2. **Server Build**: ESBuild bundles TypeScript server to `dist/index.js`
3. **Database Setup**: Drizzle runs migrations on startup
4. **Static Serving**: Express serves built client assets in production

### Database Initialization
- Automatic migration execution on server startup
- Fallback table creation if migrations fail
- Initial data seeding for development environments

The architecture prioritizes type safety, developer experience, and scalability while maintaining clear separation of concerns between the frontend visualization layer, backend API layer, and database persistence layer.