import { db } from './db';
import { 
  users, 
  useCases, 
  flowNodes,
  settings,
  transcripts,
  journeyMaps,
  type User, 
  type InsertUser, 
  type UseCase, 
  type InsertUseCase, 
  type UpdateUseCase,
  type FlowNode,
  type InsertFlowNode,
  type Setting,
  type InsertSetting,
  type UpdateSetting,
  type Transcript,
  type InsertTranscript,
  type UpdateTranscript,
  type JourneyMap,
  type InsertJourneyMap,
  type UpdateJourneyMap
} from "@shared/schema";
import { eq } from 'drizzle-orm';
import { IStorage } from './storage';

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results.length ? results[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Use case methods
  async getAllUseCases(): Promise<UseCase[]> {
    const results = await db.select().from(useCases).orderBy(useCases.updatedAt);
    return results;
  }

  async getUseCase(id: number): Promise<UseCase | undefined> {
    const results = await db.select().from(useCases).where(eq(useCases.id, id));
    return results.length ? results[0] : undefined;
  }

  async createUseCase(insertUseCase: InsertUseCase): Promise<UseCase> {
    const now = new Date();
    const result = await db.insert(useCases).values({
      ...insertUseCase,
      description: insertUseCase.description ?? null,
      nodePositions: insertUseCase.nodePositions ?? null,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }

  async updateUseCase(id: number, updateData: UpdateUseCase): Promise<UseCase> {
    const existingUseCase = await this.getUseCase(id);
    if (!existingUseCase) {
      throw new Error(`Use case with id ${id} not found`);
    }
    
    const result = await db.update(useCases)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(useCases.id, id))
      .returning();
    
    return result[0];
  }

  async deleteUseCase(id: number): Promise<void> {
    // First delete any associated flow nodes
    await db.delete(flowNodes).where(eq(flowNodes.useCaseId, id));
    
    // Then delete the use case
    await db.delete(useCases).where(eq(useCases.id, id));
  }

  // Flow node methods
  async getFlowNodesForUseCase(useCaseId: number): Promise<FlowNode[]> {
    const results = await db.select()
      .from(flowNodes)
      .where(eq(flowNodes.useCaseId, useCaseId))
      .orderBy(flowNodes.stepNumber);
    
    return results;
  }

  async createFlowNode(insertFlowNode: InsertFlowNode): Promise<FlowNode> {
    const result = await db.insert(flowNodes).values({
      ...insertFlowNode,
      stepType: insertFlowNode.stepType ?? null,
      nextNodeId: insertFlowNode.nextNodeId ?? null,
      positionX: insertFlowNode.positionX ?? null,
      positionY: insertFlowNode.positionY ?? null
    }).returning();
    
    return result[0];
  }

  async updateFlowNode(id: number, updateData: Partial<FlowNode>): Promise<FlowNode> {
    const results = await db.select().from(flowNodes).where(eq(flowNodes.id, id));
    if (!results.length) {
      throw new Error(`Flow node with id ${id} not found`);
    }
    
    const result = await db.update(flowNodes)
      .set(updateData)
      .where(eq(flowNodes.id, id))
      .returning();
    
    return result[0];
  }

  async deleteFlowNode(id: number): Promise<void> {
    await db.delete(flowNodes).where(eq(flowNodes.id, id));
  }

  // Settings methods
  async getAllSettings(): Promise<Setting[]> {
    const results = await db.select().from(settings);
    return results;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const results = await db.select().from(settings).where(eq(settings.key, key));
    return results.length ? results[0] : undefined;
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const now = new Date();
    const result = await db.insert(settings).values({
      ...insertSetting,
      value: insertSetting.value ?? null,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }

  async updateSetting(key: string, updateData: UpdateSetting): Promise<Setting> {
    const existingSetting = await this.getSetting(key);
    if (!existingSetting) {
      throw new Error(`Setting with key '${key}' not found`);
    }
    
    const result = await db.update(settings)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(settings.key, key))
      .returning();
    
    return result[0];
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }

  // Transcript methods
  async getAllTranscripts(): Promise<Transcript[]> {
    try {
      return await db.select().from(transcripts).orderBy(transcripts.updatedAt);
    } catch (error) {
      console.error("Error getting all transcripts:", error);
      return [];
    }
  }

  async getTranscript(id: number): Promise<Transcript | undefined> {
    try {
      const results = await db.select().from(transcripts).where(eq(transcripts.id, id));
      return results.length ? results[0] : undefined;
    } catch (error) {
      console.error("Error getting transcript:", error);
      return undefined;
    }
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    try {
      const now = new Date();
      const result = await db.insert(transcripts).values({
        ...insertTranscript,
        analyzedFlow: insertTranscript.analyzedFlow ?? null,
        metrics: insertTranscript.metrics ?? null,
        createdAt: now,
        updatedAt: now
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating transcript:", error);
      throw error;
    }
  }

  async updateTranscript(id: number, updateData: UpdateTranscript): Promise<Transcript> {
    try {
      const existingTranscript = await this.getTranscript(id);
      if (!existingTranscript) {
        throw new Error(`Transcript with id ${id} not found`);
      }
      
      const result = await db.update(transcripts)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(transcripts.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating transcript:", error);
      throw error;
    }
  }

  async deleteTranscript(id: number): Promise<void> {
    try {
      await db.delete(transcripts).where(eq(transcripts.id, id));
    } catch (error) {
      console.error("Error deleting transcript:", error);
      throw error;
    }
  }

  // Journey map methods
  async getAllJourneyMaps(): Promise<JourneyMap[]> {
    try {
      return await db.select().from(journeyMaps).orderBy(journeyMaps.updatedAt);
    } catch (error) {
      console.error("Error getting all journey maps:", error);
      return [];
    }
  }

  async getJourneyMap(id: number): Promise<JourneyMap | undefined> {
    try {
      const results = await db.select().from(journeyMaps).where(eq(journeyMaps.id, id));
      return results.length ? results[0] : undefined;
    } catch (error) {
      console.error("Error getting journey map:", error);
      return undefined;
    }
  }

  async createJourneyMap(insertJourneyMap: InsertJourneyMap): Promise<JourneyMap> {
    try {
      const now = new Date();
      const result = await db.insert(journeyMaps).values({
        ...insertJourneyMap,
        description: insertJourneyMap.description ?? null,
        nodeStyles: insertJourneyMap.nodeStyles ?? null,
        insights: insertJourneyMap.insights ?? null,
        createdAt: now,
        updatedAt: now
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating journey map:", error);
      throw error;
    }
  }

  async updateJourneyMap(id: number, updateData: UpdateJourneyMap): Promise<JourneyMap> {
    try {
      const existingJourneyMap = await this.getJourneyMap(id);
      if (!existingJourneyMap) {
        throw new Error(`Journey map with id ${id} not found`);
      }
      
      const result = await db.update(journeyMaps)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(journeyMaps.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error updating journey map:", error);
      throw error;
    }
  }

  async deleteJourneyMap(id: number): Promise<void> {
    try {
      await db.delete(journeyMaps).where(eq(journeyMaps.id, id));
    } catch (error) {
      console.error("Error deleting journey map:", error);
      throw error;
    }
  }

  // Function to seed initial data after migrations
  async seedInitialData(): Promise<void> {
    try {
      const existingUseCases = await this.getAllUseCases();
      
      // Only seed if there are no existing use cases
      if (existingUseCases.length === 0) {
        await this.createSampleUseCases();
      }
  
      // Seed default settings if they don't exist
      await this.seedDefaultSettings();
      
      // Initialize sample journey maps if needed
      try {
        const existingJourneyMaps = await this.getAllJourneyMaps();
        if (existingJourneyMaps.length === 0) {
          await this.createSampleJourneyMap();
        }
      } catch (error: any) {
        console.log("Skipping journey map creation, tables may not exist yet:", error?.message);
      }
    } catch (error: any) {
      console.error("Error during data seeding:", error?.message);
      // Continue with initialization despite seeding errors
    }
  }

  // Helper method to seed default settings
  private async seedDefaultSettings(): Promise<void> {
    const defaultSettings = [
      { key: 'openai_api_key', value: '' },
      { key: 'openai_system_prompt', value: 'You are a helpful assistant that responds to customer requests. Your goal is to understand the customer needs and provide clear, concise and helpful responses.' },
      { key: 'openai_user_prompt', value: 'Please respond to the following customer message in a professional and helpful manner:' },
      { key: 'agent_persona', value: 'Friendly, professional, and solution-oriented customer service representative who communicates clearly and efficiently while maintaining a positive tone.' }
    ];

    for (const setting of defaultSettings) {
      const existingSetting = await this.getSetting(setting.key);
      if (!existingSetting) {
        await this.createSetting(setting);
      }
    }
  }

  // Helper method to create a sample journey map
  private async createSampleJourneyMap() {
    // Create a sample customer support journey map
    const sampleJourneyMap = {
      title: "Customer Support Journey Map",
      description: "Analysis of common customer support interaction paths",
      nodeData: {
        nodes: [
          {
            id: "entry",
            type: "input",
            label: "Initial Contact",
            data: {
              nodeType: "entry",
              description: "Customer initiates contact through chat or phone",
              metrics: {
                frequency: 100,
                duration: 0
              }
            },
            position: { x: 100, y: 150 }
          },
          {
            id: "issue-identification",
            type: "default",
            label: "Issue Identification",
            data: {
              nodeType: "process",
              description: "Agent identifies the nature of the customer's issue",
              metrics: {
                frequency: 100,
                duration: 45,
                satisfaction: 0.8
              }
            },
            position: { x: 250, y: 150 }
          },
          {
            id: "decision-complexity",
            type: "default",
            label: "Complexity Assessment",
            data: {
              nodeType: "decision",
              description: "Determining if the issue is simple or complex"
            },
            position: { x: 400, y: 150 }
          },
          {
            id: "simple-resolution",
            type: "default",
            label: "Simple Resolution",
            data: {
              nodeType: "process",
              description: "Agent solves issue directly",
              metrics: {
                frequency: 65,
                duration: 180,
                satisfaction: 0.9
              }
            },
            position: { x: 550, y: 80 }
          },
          {
            id: "escalation",
            type: "default",
            label: "Escalation",
            data: {
              nodeType: "process",
              description: "Issue is escalated to a specialist",
              metrics: {
                frequency: 35,
                duration: 420,
                satisfaction: 0.6
              }
            },
            position: { x: 550, y: 220 }
          },
          {
            id: "follow-up",
            type: "default",
            label: "Follow-up Required",
            data: {
              nodeType: "decision",
              description: "Determine if additional follow-up is needed"
            },
            position: { x: 700, y: 150 }
          },
          {
            id: "case-closed-simple",
            type: "output",
            label: "Case Closed",
            data: {
              nodeType: "exit",
              description: "Issue resolved successfully without follow-up",
              metrics: {
                frequency: 70,
                satisfaction: 0.95
              }
            },
            position: { x: 850, y: 80 }
          },
          {
            id: "schedule-followup",
            type: "default",
            label: "Schedule Follow-up",
            data: {
              nodeType: "process",
              description: "Agent schedules future contact",
              metrics: {
                frequency: 30,
                duration: 120,
                satisfaction: 0.85
              }
            },
            position: { x: 850, y: 220 }
          },
          {
            id: "case-closed-followup",
            type: "output",
            label: "Case Closed after Follow-up",
            data: {
              nodeType: "exit",
              description: "Issue resolved after additional follow-up",
              metrics: {
                frequency: 30,
                satisfaction: 0.9
              }
            },
            position: { x: 1000, y: 220 }
          }
        ],
        edges: [
          {
            id: "entry-to-identification",
            source: "entry",
            target: "issue-identification",
            type: "default"
          },
          {
            id: "identification-to-decision",
            source: "issue-identification",
            target: "decision-complexity",
            type: "default"
          },
          {
            id: "decision-to-simple",
            source: "decision-complexity",
            target: "simple-resolution",
            type: "success",
            label: "Simple Issue (65%)",
            data: {
              frequency: 65,
              condition: "Issue can be resolved with standard procedures"
            }
          },
          {
            id: "decision-to-escalation",
            source: "decision-complexity",
            target: "escalation",
            type: "warning",
            label: "Complex Issue (35%)",
            data: {
              frequency: 35,
              condition: "Issue requires specialist knowledge"
            }
          },
          {
            id: "simple-to-followup",
            source: "simple-resolution",
            target: "follow-up",
            type: "default"
          },
          {
            id: "escalation-to-followup",
            source: "escalation",
            target: "follow-up",
            type: "default"
          },
          {
            id: "followup-to-closed",
            source: "follow-up",
            target: "case-closed-simple",
            type: "success",
            label: "No Follow-up Needed (70%)",
            data: {
              frequency: 70,
              condition: "Issue fully resolved"
            }
          },
          {
            id: "followup-to-schedule",
            source: "follow-up",
            target: "schedule-followup",
            type: "warning",
            label: "Follow-up Required (30%)",
            data: {
              frequency: 30,
              condition: "Additional assistance needed"
            }
          },
          {
            id: "schedule-to-closed",
            source: "schedule-followup",
            target: "case-closed-followup",
            type: "success"
          }
        ]
      },
      nodeStyles: {
        "entry": { backgroundColor: "#e6f7ff", borderColor: "#1890ff" },
        "process": { backgroundColor: "#f6ffed", borderColor: "#52c41a" },
        "decision": { backgroundColor: "#fff7e6", borderColor: "#faad14" },
        "exit": { backgroundColor: "#f9f0ff", borderColor: "#722ed1" }
      },
      insights: {
        bottlenecks: [
          {
            nodeId: "escalation",
            reason: "Long wait times for specialist assistance",
            suggestion: "Consider training more Level 1 agents on common complex issues"
          }
        ],
        dropoffs: [
          {
            nodeId: "follow-up",
            frequency: 5,
            reason: "Customers abandoning after initial resolution attempt"
          }
        ],
        improvements: [
          {
            type: "efficiency",
            description: "Improved knowledge base for simple issue resolution",
            impact: "Could reduce average handle time by 15%"
          },
          {
            type: "satisfaction",
            description: "Proactive follow-up for complex issues",
            impact: "Could improve CSAT scores for escalated issues by 10%"
          }
        ]
      }
    };

    // Insert the sample journey map
    await this.createJourneyMap(sampleJourneyMap);
    console.log("Sample journey map created successfully");
  }

  // Helper method to add sample data
  private async createSampleUseCases() {
    // Sample use case 1: Customer Order Inquiry
    await this.createUseCase({
      title: "Customer Order Inquiry",
      description: "Agent helps customer track their order status",
      nodePositions: JSON.stringify({
        '0': { x: 100, y: 100 },
        '1': { x: 350, y: 100 },
        '2': { x: 600, y: 100 },
        '3': { x: 350, y: 300 },
        '4': { x: 600, y: 300 }
      }),
      conversationFlow: `Customer: I placed an order last week and haven't received a shipping confirmation yet.
Agent: I'd be happy to help you with that. Could you please provide your order number?
→
Customer: Yes, it's ORD-12345.
Agent: Thank you. Let me look that up for you... I can see that your order is currently being processed. It typically takes 2-3 business days before shipping.
→
Customer: Is there any way to expedite the shipping?
Agent: Yes, we can upgrade your shipping to express delivery for an additional $10. Would you like me to make that change?
→
Customer: Yes, please upgrade it.
Agent: I've upgraded your shipping to express delivery. The additional charge has been applied to your original payment method. Your order should now ship within 24 hours.
→
Customer: Great, thank you. When will I receive the tracking number?
Agent: You'll receive an email with the tracking information as soon as your order ships, which should be within 24 hours. Is there anything else I can help you with today?`
    });
    
    // Sample use case 2: Product Recommendation
    await this.createUseCase({
      title: "Product Recommendation",
      description: "Agent helps customer find the right product based on customer needs",
      nodePositions: JSON.stringify({
        '0': { x: 150, y: 100 },
        '1': { x: 400, y: 100 },
        '2': { x: 650, y: 100 },
        '3': { x: 150, y: 300 },
        '4': { x: 400, y: 300 },
        '5': { x: 650, y: 300 }
      }),
      conversationFlow: `Customer: I'm looking for a new laptop for work.
Agent: I'd be happy to help you find a laptop for work! Could you tell me what kind of work you'll be using it for?
→
Customer: I need it for programming and running virtual machines.
Agent: For programming and virtual machines, you'll need something with good processing power and plenty of RAM. Do you have a preference for screen size?
→
Customer: I prefer a 15-inch screen, and I need good battery life too.
Agent: Based on your requirements, I recommend the TechPro X5 Developer Edition. It has a 15-inch screen, 32GB RAM, and up to 10 hours of battery life. Would you like more details?
→
Customer: That sounds good. What's the price range?
Agent: The TechPro X5 Developer Edition starts at $1,299. We currently have a promotion that includes a free laptop bag and extended warranty. Would you like to proceed with this option?
→
Customer: Yes, I'd like to purchase it.
Agent: Great choice! I'll add the TechPro X5 to your cart with the promotional items. Would you like to check out now or continue shopping?
→
Customer: I'll check out now.
Agent: Perfect! I'll guide you through our quick checkout process. Would you prefer standard shipping or expedited delivery?`
    });
    
    // Sample use case 3: Account Setup
    await this.createUseCase({
      title: "Account Setup",
      description: "Agent guides new customer through account creation and setup",
      nodePositions: JSON.stringify({
        '0': { x: 200, y: 100 },
        '1': { x: 200, y: 250 },
        '2': { x: 450, y: 100 },
        '3': { x: 450, y: 250 },
        '4': { x: 700, y: 175 }
      }),
      conversationFlow: `Customer: I'd like to set up a new account for your service.
Agent: Welcome! I'd be happy to help you set up a new account. To get started, could you please provide your email address?
→
Customer: My email is customer@example.com
Agent: Thank you! I've sent a verification code to that email address. Could you please check your inbox and provide the code?
→
Customer: The code is 123456.
Agent: Perfect! Your email has been verified. Now, let's create a password for your account. It should be at least 8 characters long with a mix of letters, numbers, and symbols.
→
Customer: I've created the password.
Agent: Great! Your account has been created successfully. Would you like to set up two-factor authentication for added security?
→
Customer: Yes, that sounds like a good idea.
Agent: Excellent choice! I'll guide you through the two-factor authentication setup. Would you prefer to use SMS or an authenticator app for receiving codes?`
    });
  }
}