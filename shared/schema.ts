import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUseCaseSchema = createInsertSchema(useCases).pick({
  title: true,
  description: true,
  conversationFlow: true,
});

export const updateUseCaseSchema = createInsertSchema(useCases).pick({
  title: true,
  description: true,
  conversationFlow: true,
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
});

export const insertFlowNodeSchema = createInsertSchema(flowNodes).pick({
  useCaseId: true,
  stepNumber: true,
  stepType: true,
  customerText: true,
  agentText: true,
  nextNodeId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type UpdateUseCase = z.infer<typeof updateUseCaseSchema>;
export type UseCase = typeof useCases.$inferSelect;

export type InsertFlowNode = z.infer<typeof insertFlowNodeSchema>;
export type FlowNode = typeof flowNodes.$inferSelect;

// Flow and conversation types
export interface Message {
  role: string;  // "customer" or "agent"
  text: string;
}

export interface ConversationStep {
  messages: Message[];
  stepType?: string;
  stepNumber: number;
}

export interface ParsedFlow {
  steps: ConversationStep[];
}
