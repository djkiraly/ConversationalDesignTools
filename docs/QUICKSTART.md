# Quick Start Guide

This guide will help you get started with the Conversational AI Workflow Builder quickly. Follow these steps to set up your environment and start using the application.

## Installation

### Prerequisites

Before you begin, make sure you have:

1. **Node.js** version 20.x or later installed
2. **PostgreSQL** version 16.x or later installed and running
3. An **OpenAI API key** for the AI-powered features

### Step 1: Set Up the Application

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### Step 2: Configure Environment

Create an environment file:

```bash
cp .env.example .env
```

Edit the `.env` file and update these essential settings:

```
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
OPENAI_API_KEY=your_openai_api_key
```

### Step 3: Initialize the Database

Run the database migration:

```bash
npm run db:push
```

### Step 4: Start the Application

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:5000](http://localhost:5000)

## First Steps

Once you have the application running, here's how to get started:

### 1. Explore the Dashboard

The dashboard provides an overview of your use cases, customer journeys, and action plans.

### 2. Create Your First Use Case

1. Navigate to "Use Cases" in the sidebar
2. Click "New Use Case"
3. Fill in the details:
   - Title: Give your use case a descriptive name
   - Description: Explain the purpose of this use case
   - Industry: Select the relevant industry
   - Agent Persona: Define how your AI agent should behave

### 3. Design a Conversation Flow

1. Open your newly created use case
2. Click "Edit Flow" to open the flow editor
3. Add conversation steps by clicking the "+" button
4. Connect steps to create different paths
5. Save your flow

### 4. Generate AI Suggestions

1. Click "AI Suggestions" in the flow editor
2. The system will analyze your flow and provide improvement suggestions
3. Review and apply suggestions as needed

### 5. Test Your Conversation

1. Click "Preview" to see how your conversation would flow
2. Walk through the steps to verify the logic
3. Make adjustments as needed

### 6. Create an Action Plan

1. Navigate to "Action Plans"
2. Click "New Action Plan"
3. Select your use case to base the plan on
4. Review and edit the AI-generated action items
5. Assign priorities and deadlines

## Key Features

### AI-Assisted Editing

- Use the "AI Suggestions" button to get improvement ideas for your conversation flow
- The AI can help refine agent responses, create more natural customer interactions, and fix logical issues

### Flow Visualization

- Drag and drop nodes to organize your conversation flow
- Create complex branching paths based on user responses
- Visualize the entire customer journey in one view

### Export Options

- Export your conversation flow as an image
- Generate detailed documentation for your use case
- Share your flows with team members

### Persona Management

- Create and save agent personas for consistent interactions
- Use AI to suggest improvements to your agent's tone and style
- Apply personas across multiple use cases

## Next Steps

After you've created your first use case and flow:

1. **Explore advanced features** like multi-path nodes and conditional logic
2. **Create customer profiles** to test your flows against different personas
3. **Generate comprehensive action plans** based on your conversation flows
4. **Export your flows** for implementation in your production systems

## Getting Help

If you encounter any issues:

- Check the [README.md](README.md) file for general information
- Consult [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions
- Read [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute to the project

For specific technical issues, check the Troubleshooting section in INSTALLATION.md.

Happy designing!