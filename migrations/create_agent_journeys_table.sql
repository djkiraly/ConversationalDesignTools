-- Create agent_journeys table
CREATE TABLE IF NOT EXISTS "agent_journeys" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "agentName" TEXT NULL,
  "purpose" TEXT NULL,
  "notes" TEXT NULL,
  "summary" TEXT NULL,
  "inputInterpretation" TEXT NULL,
  "guardrails" TEXT NULL,
  "backendSystems" TEXT[] DEFAULT '{}',
  "contextManagement" TEXT NULL,
  "escalationRules" TEXT NULL,
  "errorMonitoring" TEXT NULL,
  "nodes" JSONB NULL,
  "edges" JSONB NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);