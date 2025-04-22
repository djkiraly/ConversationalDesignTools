import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
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

// Customer Journey model
export const customerJourneys = pgTable("customer_journeys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  nodes: json("nodes").notNull(), // Storing ReactFlow nodes
  edges: json("edges").notNull(), // Storing ReactFlow edges
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerJourneySchema = createInsertSchema(customerJourneys).pick({
  title: true,
  nodes: true,
  edges: true,
});

export const updateCustomerJourneySchema = createInsertSchema(customerJourneys).pick({
  title: true,
  nodes: true,
  edges: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type UpdateUseCase = z.infer<typeof updateUseCaseSchema>;
export type UseCase = typeof useCases.$inferSelect;

export type InsertFlowNode = z.infer<typeof insertFlowNodeSchema>;
export type FlowNode = typeof flowNodes.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type UpdateSetting = z.infer<typeof updateSettingSchema>;
export type Setting = typeof settings.$inferSelect;

export type InsertCustomerJourney = z.infer<typeof insertCustomerJourneySchema>;
export type UpdateCustomerJourney = z.infer<typeof updateCustomerJourneySchema>;
export type CustomerJourney = typeof customerJourneys.$inferSelect;

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
