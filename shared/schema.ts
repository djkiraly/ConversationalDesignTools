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
  customer: text("customer"),  // Store the customer name for this use case
  
  // New fields for properly defining and scoping the use case
  problemStatement: text("problem_statement"),  // Concise problem statement
  proposedSolution: text("proposed_solution"),  // High-level description of AI solution
  keyObjectives: text("key_objectives"),  // Quantifiable objectives and success metrics
  requiredDataInputs: text("required_data_inputs"),  // Sources, types, availability status
  expectedOutputs: text("expected_outputs"),  // Expected outputs and actions
  keyStakeholders: text("key_stakeholders"),  // Business and technical stakeholders
  scope: text("scope"),  // High-level scope (inclusions & exclusions)
  potentialRisks: text("potential_risks"),  // Potential risks and dependencies
  estimatedImpact: text("estimated_impact"),  // Estimated impact/value
  
  conversationFlow: text("conversation_flow"),
  nodePositions: text("node_positions"),  // Store node positions as JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUseCaseSchema = createInsertSchema(useCases).pick({
  title: true,
  description: true,
  customer: true,
  problemStatement: true,
  proposedSolution: true,
  keyObjectives: true,
  requiredDataInputs: true,
  expectedOutputs: true,
  keyStakeholders: true,
  scope: true,
  potentialRisks: true,
  estimatedImpact: true,
  conversationFlow: true,
  nodePositions: true,
});

export const updateUseCaseSchema = createInsertSchema(useCases).pick({
  title: true,
  description: true,
  customer: true,
  problemStatement: true,
  proposedSolution: true,
  keyObjectives: true,
  requiredDataInputs: true,
  expectedOutputs: true,
  keyStakeholders: true,
  scope: true,
  potentialRisks: true,
  estimatedImpact: true,
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
  customerName: text("customer_name"),
  workflowIntent: text("workflow_intent"),
  notes: text("notes"),
  summary: text("summary"), // AI-generated journey summary
  nodes: json("nodes").notNull(), // Storing ReactFlow nodes
  edges: json("edges").notNull(), // Storing ReactFlow edges
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerJourneySchema = createInsertSchema(customerJourneys).pick({
  title: true,
  customerName: true,
  workflowIntent: true,
  notes: true,
  summary: true,
  nodes: true,
  edges: true,
});

export const updateCustomerJourneySchema = createInsertSchema(customerJourneys).pick({
  title: true,
  customerName: true,
  workflowIntent: true,
  notes: true,
  summary: true,
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

// Customers model
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  companyWebsite: text("company_website"),
  primaryContactName: text("primary_contact_name").notNull(),
  primaryContactPhone: text("primary_contact_phone"),
  primaryContactEmail: text("primary_contact_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  companyName: true,
  companyWebsite: true,
  primaryContactName: true,
  primaryContactPhone: true,
  primaryContactEmail: true,
});

export const updateCustomerSchema = createInsertSchema(customers).pick({
  companyName: true,
  companyWebsite: true,
  primaryContactName: true,
  primaryContactPhone: true,
  primaryContactEmail: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Action Plan model
export const actionPlans = pgTable("action_plans", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  // Business Discovery
  industry: text("industry"),
  primaryChannel: text("primary_channel"),
  interactionVolume: text("interaction_volume"),
  currentAutomation: text("current_automation"),
  
  // Pain Point Assessment
  biggestChallenge: text("biggest_challenge"),
  repetitiveProcesses: text("repetitive_processes"),
  
  // AI Agent Goals
  aiGoals: json("ai_goals").notNull().$type<string[]>().default([]),
  goalDetails: json("goal_details").notNull().$type<Record<string, string>>().default({}),
  autonomyLevel: text("autonomy_level"),
  
  // System & Integration Readiness
  currentPlatforms: text("current_platforms"),
  teamComfort: text("team_comfort"),
  apisAvailable: text("apis_available"),
  
  // Success Metrics
  successMetrics: json("success_metrics").notNull().$type<string[]>().default([]),
  
  // Plan status
  status: text("status").default("draft").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertActionPlanSchema = createInsertSchema(actionPlans).pick({
  title: true,
  customerId: true,
  industry: true,
  primaryChannel: true,
  interactionVolume: true,
  currentAutomation: true,
  biggestChallenge: true,
  repetitiveProcesses: true,
  aiGoals: true,
  goalDetails: true,
  autonomyLevel: true,
  currentPlatforms: true,
  teamComfort: true,
  apisAvailable: true,
  successMetrics: true,
  status: true,
});

export const updateActionPlanSchema = createInsertSchema(actionPlans).pick({
  title: true,
  customerId: true,
  industry: true,
  primaryChannel: true,
  interactionVolume: true,
  currentAutomation: true,
  biggestChallenge: true,
  repetitiveProcesses: true,
  aiGoals: true,
  goalDetails: true,
  autonomyLevel: true,
  currentPlatforms: true,
  teamComfort: true,
  apisAvailable: true,
  successMetrics: true,
  status: true,
});

export type InsertActionPlan = z.infer<typeof insertActionPlanSchema>;
export type UpdateActionPlan = z.infer<typeof updateActionPlanSchema>;
export type ActionPlan = typeof actionPlans.$inferSelect;
