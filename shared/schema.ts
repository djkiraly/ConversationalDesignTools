import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (for potential future auth)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Conversation/UseCase model
export const useCases = pgTable("use_cases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  conversationFlow: text("conversation_flow").notNull(),
  nodePositions: text("node_positions"),  // Store node positions as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUseCaseSchema = createInsertSchema(useCases).pick({
  title: true,
  description: true,
  conversationFlow: true,
  nodePositions: true,
});

export const updateUseCaseSchema = createInsertSchema(useCases).pick({
  title: true,
  description: true,
  conversationFlow: true,
  nodePositions: true,
});

// Flow Node model (for storing parsed conversation nodes)
export const flowNodes = pgTable("flow_nodes", {
  id: serial("id").primaryKey(),
  useCaseId: integer("use_case_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  stepType: text("step_type"),
  customerText: text("customer_text").notNull(),
  agentText: text("agent_text").notNull(),
  nextNodeId: integer("next_node_id"),
  positionX: real("position_x"),  // X coordinate in the flow diagram
  positionY: real("position_y"),  // Y coordinate in the flow diagram
});

export const insertFlowNodeSchema = createInsertSchema(flowNodes).pick({
  useCaseId: true,
  stepNumber: true,
  stepType: true,
  customerText: true,
  agentText: true,
  nextNodeId: true,
  positionX: true,
  positionY: true,
});

// Conversation Transcripts model for storing raw conversation data
export const transcripts = pgTable("transcripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(), // e.g., "chat", "call", "email"
  content: text("content").notNull(), // Raw transcript content
  analyzedFlow: jsonb("analyzed_flow"), // Analyzed conversation flow as JSON
  metrics: jsonb("metrics"), // Analysis metrics as JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertTranscriptSchema = createInsertSchema(transcripts).pick({
  title: true,
  source: true,
  content: true,
  analyzedFlow: true,
  metrics: true,
});

export const updateTranscriptSchema = createInsertSchema(transcripts).pick({
  title: true,
  source: true,
  content: true,
  analyzedFlow: true,
  metrics: true,
});

// Journey Map model for storing customer journey maps
export const journeyMaps = pgTable("journey_maps", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  nodeData: jsonb("node_data").notNull(), // Stores nodes, edges, and layout
  nodeStyles: jsonb("node_styles"), // Custom styling for nodes
  insights: jsonb("insights"), // AI-generated insights
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertJourneyMapSchema = createInsertSchema(journeyMaps).pick({
  title: true,
  description: true,
  nodeData: true,
  nodeStyles: true,
  insights: true,
});

export const updateJourneyMapSchema = createInsertSchema(journeyMaps).pick({
  title: true,
  description: true,
  nodeData: true,
  nodeStyles: true,
  insights: true,
});

// Settings model for app configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export const updateSettingSchema = createInsertSchema(settings).pick({
  value: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type UpdateUseCase = z.infer<typeof updateUseCaseSchema>;
export type UseCase = typeof useCases.$inferSelect;

export type InsertFlowNode = z.infer<typeof insertFlowNodeSchema>;
export type FlowNode = typeof flowNodes.$inferSelect;

export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type UpdateTranscript = z.infer<typeof updateTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;

export type InsertJourneyMap = z.infer<typeof insertJourneyMapSchema>;
export type UpdateJourneyMap = z.infer<typeof updateJourneyMapSchema>;
export type JourneyMap = typeof journeyMaps.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type UpdateSetting = z.infer<typeof updateSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Flow and conversation types
export interface Message {
  role: string;  // "customer" or "agent"
  text: string;
}

export interface ConversationStep {
  messages: Message[];
  stepType?: string;
  stepNumber: number;
  position?: { x: number; y: number };
}

export interface ParsedFlow {
  steps: ConversationStep[];
}

// Journey mapping types
export interface JourneyNode {
  id: string;
  type: string; // e.g., "intent", "action", "decision", "exit"
  label: string;
  data: {
    nodeType: string;
    description?: string;
    metrics?: {
      frequency?: number;
      duration?: number;
      satisfaction?: number;
      dropoff?: number;
    };
    tags?: string[];
    examples?: string[];
  };
  position: { x: number; y: number };
}

export interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  type: string; // e.g., "success", "failure", "default"
  label?: string;
  data?: {
    frequency?: number;
    condition?: string;
  };
}

export interface JourneyData {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
}

export interface TranscriptAnalysisResult {
  intents: {
    name: string;
    frequency: number;
    examples: string[];
  }[];
  sentiments: {
    positive: number;
    negative: number;
    neutral: number;
  };
  journeyMap: JourneyData;
  insights: {
    bottlenecks: {
      nodeId: string;
      reason: string;
      suggestion: string;
    }[];
    dropoffs: {
      nodeId: string;
      frequency: number;
      reason: string;
    }[];
    improvements: {
      type: string;
      description: string;
      impact: string;
    }[];
  };
}
