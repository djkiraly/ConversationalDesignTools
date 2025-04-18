import { db } from './db';
import { 
  users, 
  useCases, 
  flowNodes,
  settings,
  type User, 
  type InsertUser, 
  type UseCase, 
  type InsertUseCase, 
  type UpdateUseCase,
  type FlowNode,
  type InsertFlowNode,
  type Setting,
  type InsertSetting,
  type UpdateSetting
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

  // Function to seed initial data after migrations
  async seedInitialData(): Promise<void> {
    const existingUseCases = await this.getAllUseCases();
    
    // Only seed if there are no existing use cases
    if (existingUseCases.length === 0) {
      await this.createSampleUseCases();
    }

    // Seed default settings if they don't exist
    await this.seedDefaultSettings();
  }

  // Helper method to seed default settings
  private async seedDefaultSettings(): Promise<void> {
    const defaultSettings = [
      { key: 'openai_api_key', value: '' },
      { key: 'openai_system_prompt', value: 'You are a helpful assistant that responds to customer requests. Your goal is to understand the customer needs and provide clear, concise and helpful responses.' },
      { key: 'openai_user_prompt', value: 'Please respond to the following customer message in a professional and helpful manner:' }
    ];

    for (const setting of defaultSettings) {
      const existingSetting = await this.getSetting(setting.key);
      if (!existingSetting) {
        await this.createSetting(setting);
      }
    }
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