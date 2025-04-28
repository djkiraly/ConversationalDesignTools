import { db } from './db';
import { 
  users, 
  useCases, 
  flowNodes,
  settings,
  customerJourneys,
  customers,
  actionPlans,
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
  type CustomerJourney,
  type InsertCustomerJourney,
  type UpdateCustomerJourney,
  type Customer,
  type InsertCustomer,
  type UpdateCustomer,
  type ActionPlan,
  type InsertActionPlan,
  type UpdateActionPlan
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
      customer: insertUseCase.customer ?? null,
      problemStatement: insertUseCase.problemStatement ?? null,
      proposedSolution: insertUseCase.proposedSolution ?? null,
      keyObjectives: insertUseCase.keyObjectives ?? null,
      requiredDataInputs: insertUseCase.requiredDataInputs ?? null,
      expectedOutputs: insertUseCase.expectedOutputs ?? null,
      keyStakeholders: insertUseCase.keyStakeholders ?? null,
      scope: insertUseCase.scope ?? null,
      potentialRisks: insertUseCase.potentialRisks ?? null,
      estimatedImpact: insertUseCase.estimatedImpact ?? null,
      conversationFlow: insertUseCase.conversationFlow ?? null,
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
  
  // Customer Journey methods
  async getAllCustomerJourneys(): Promise<CustomerJourney[]> {
    const results = await db.select()
      .from(customerJourneys)
      .orderBy(customerJourneys.updatedAt);
    return results;
  }
  
  async getCustomerJourney(id: number): Promise<CustomerJourney | undefined> {
    const results = await db.select().from(customerJourneys).where(eq(customerJourneys.id, id));
    return results.length ? results[0] : undefined;
  }
  
  async createCustomerJourney(journeyData: InsertCustomerJourney): Promise<CustomerJourney> {
    const now = new Date();
    const result = await db.insert(customerJourneys).values({
      ...journeyData,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  
  async updateCustomerJourney(id: number, updateData: UpdateCustomerJourney): Promise<CustomerJourney> {
    const existingJourney = await this.getCustomerJourney(id);
    if (!existingJourney) {
      throw new Error(`Customer journey with id ${id} not found`);
    }
    
    const result = await db.update(customerJourneys)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(customerJourneys.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteCustomerJourney(id: number): Promise<void> {
    await db.delete(customerJourneys).where(eq(customerJourneys.id, id));
  }
  
  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    const results = await db.select()
      .from(customers)
      .orderBy(customers.companyName);
    return results;
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const results = await db.select().from(customers).where(eq(customers.id, id));
    return results.length ? results[0] : undefined;
  }
  
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const now = new Date();
    const result = await db.insert(customers).values({
      ...customerData,
      createdAt: now,
      updatedAt: now
    }).returning();
    return result[0];
  }
  
  async updateCustomer(id: number, updateData: UpdateCustomer): Promise<Customer> {
    const existingCustomer = await this.getCustomer(id);
    if (!existingCustomer) {
      throw new Error(`Customer with id ${id} not found`);
    }
    
    const result = await db.update(customers)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(customers.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }
  
  // Action Plan methods
  async getAllActionPlans(): Promise<ActionPlan[]> {
    const results = await db.select()
      .from(actionPlans)
      .orderBy(actionPlans.updatedAt);
    return results;
  }
  
  async getActionPlan(id: number): Promise<ActionPlan | undefined> {
    const results = await db.select().from(actionPlans).where(eq(actionPlans.id, id));
    return results.length ? results[0] : undefined;
  }
  
  async createActionPlan(planData: InsertActionPlan): Promise<ActionPlan> {
    const now = new Date();
    
    console.log("DbStorage createActionPlan - Received aiGoals:", JSON.stringify(planData.aiGoals, null, 2));
    console.log("DbStorage createActionPlan - aiGoals is Array?", Array.isArray(planData.aiGoals));
    console.log("DbStorage createActionPlan - aiGoals type:", typeof planData.aiGoals);
    
    // Process aiGoals field to ensure type safety
    let aiGoals: string[] = [];
    
    if (planData.aiGoals !== undefined) {
      if (Array.isArray(planData.aiGoals)) {
        aiGoals = planData.aiGoals;
        console.log("DbStorage createActionPlan - Using array aiGoals:", JSON.stringify(aiGoals, null, 2));
      } else if (typeof planData.aiGoals === 'object') {
        // Handle case where aiGoals might come in as an object with array-like properties
        try {
          aiGoals = Array.from(Object.values(planData.aiGoals as any));
          console.log("DbStorage createActionPlan - Converted object to array:", JSON.stringify(aiGoals, null, 2));
        } catch (err) {
          console.error("Failed to convert aiGoals to array:", err);
          aiGoals = [];
        }
      } else if (typeof planData.aiGoals === 'string') {
        // Handle string - could be a JSON string
        try {
          const parsed = JSON.parse(planData.aiGoals as string);
          aiGoals = Array.isArray(parsed) ? parsed : [];
          console.log("DbStorage createActionPlan - Parsed string to array:", JSON.stringify(aiGoals, null, 2));
        } catch (err) {
          console.error("Failed to parse aiGoals string:", err);
          aiGoals = [planData.aiGoals as string];
        }
      }
    }
    
    // Process array fields to ensure type safety
    const processedData = {
      ...planData,
      aiGoals: aiGoals,
      successMetrics: Array.isArray(planData.successMetrics) ? planData.successMetrics : [],
      createdAt: now,
      updatedAt: now
    };
    
    console.log("DbStorage createActionPlan - Final processedData aiGoals:", JSON.stringify(processedData.aiGoals, null, 2));
    
    const result = await db.insert(actionPlans).values(processedData).returning();
    console.log("DbStorage createActionPlan - Created result aiGoals:", JSON.stringify(result[0].aiGoals, null, 2));
    
    return result[0];
  }
  
  async updateActionPlan(id: number, updateData: UpdateActionPlan): Promise<ActionPlan> {
    const existingPlan = await this.getActionPlan(id);
    if (!existingPlan) {
      throw new Error(`Action plan with id ${id} not found`);
    }
    
    console.log("DbStorage updateActionPlan - Existing aiGoals:", JSON.stringify(existingPlan.aiGoals, null, 2));
    console.log("DbStorage updateActionPlan - New aiGoals:", JSON.stringify(updateData.aiGoals, null, 2));
    console.log("DbStorage updateActionPlan - aiGoals is Array?", Array.isArray(updateData.aiGoals));
    console.log("DbStorage updateActionPlan - aiGoals type:", typeof updateData.aiGoals);
    
    // Process array fields to ensure type safety
    let aiGoals = existingPlan.aiGoals;
    
    if (updateData.aiGoals !== undefined) {
      if (Array.isArray(updateData.aiGoals)) {
        aiGoals = updateData.aiGoals;
        console.log("DbStorage updateActionPlan - Using array aiGoals:", JSON.stringify(aiGoals, null, 2));
      } else if (typeof updateData.aiGoals === 'object') {
        // Handle case where aiGoals might come in as an object with array-like properties
        try {
          aiGoals = Array.from(Object.values(updateData.aiGoals as any));
          console.log("DbStorage updateActionPlan - Converted object to array:", JSON.stringify(aiGoals, null, 2));
        } catch (err) {
          console.error("Failed to convert aiGoals to array:", err);
          aiGoals = [];
        }
      } else if (typeof updateData.aiGoals === 'string') {
        // Handle string - could be a JSON string
        try {
          const parsed = JSON.parse(updateData.aiGoals as string);
          aiGoals = Array.isArray(parsed) ? parsed : [];
          console.log("DbStorage updateActionPlan - Parsed string to array:", JSON.stringify(aiGoals, null, 2));
        } catch (err) {
          console.error("Failed to parse aiGoals string:", err);
          aiGoals = [updateData.aiGoals as string];
        }
      } else {
        // Fallback
        aiGoals = [];
      }
    }
    
    const processedData = {
      ...updateData,
      aiGoals: aiGoals,
      successMetrics: updateData.successMetrics !== undefined 
        ? (Array.isArray(updateData.successMetrics) ? updateData.successMetrics : []) 
        : existingPlan.successMetrics,
      updatedAt: new Date()
    };
    
    console.log("DbStorage updateActionPlan - Final processedData aiGoals:", JSON.stringify(processedData.aiGoals, null, 2));
    
    const result = await db.update(actionPlans)
      .set(processedData)
      .where(eq(actionPlans.id, id))
      .returning();
    
    console.log("DbStorage updateActionPlan - Updated result aiGoals:", JSON.stringify(result[0].aiGoals, null, 2));
    
    return result[0];
  }
  
  async deleteActionPlan(id: number): Promise<void> {
    await db.delete(actionPlans).where(eq(actionPlans.id, id));
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