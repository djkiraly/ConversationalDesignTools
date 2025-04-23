import { 
  users, 
  useCases, 
  flowNodes,
  settings,
  customerJourneys,
  customers,
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
  type UpdateCustomer
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Use case management
  async getAllUseCases(): Promise<UseCase[]> {
    return await db.select().from(useCases).orderBy(useCases.updatedAt);
  }

  async getUseCase(id: number): Promise<UseCase | undefined> {
    const [useCase] = await db.select().from(useCases).where(eq(useCases.id, id));
    return useCase || undefined;
  }

  async createUseCase(insertUseCase: InsertUseCase): Promise<UseCase> {
    const [useCase] = await db
      .insert(useCases)
      .values(insertUseCase)
      .returning();
    return useCase;
  }

  async updateUseCase(id: number, updateData: UpdateUseCase): Promise<UseCase> {
    const [updatedUseCase] = await db
      .update(useCases)
      .set(updateData)
      .where(eq(useCases.id, id))
      .returning();
    
    if (!updatedUseCase) {
      throw new Error(`Use case with id ${id} not found`);
    }
    
    return updatedUseCase;
  }

  async deleteUseCase(id: number): Promise<void> {
    await db.delete(useCases).where(eq(useCases.id, id));
    // Also delete associated flow nodes
    await db.delete(flowNodes).where(eq(flowNodes.useCaseId, id));
  }
  
  // Flow node management
  async getFlowNodesForUseCase(useCaseId: number): Promise<FlowNode[]> {
    return await db
      .select()
      .from(flowNodes)
      .where(eq(flowNodes.useCaseId, useCaseId))
      .orderBy(flowNodes.stepNumber);
  }

  async createFlowNode(insertFlowNode: InsertFlowNode): Promise<FlowNode> {
    const [flowNode] = await db
      .insert(flowNodes)
      .values(insertFlowNode)
      .returning();
    return flowNode;
  }

  async updateFlowNode(id: number, updateData: Partial<FlowNode>): Promise<FlowNode> {
    const [updatedNode] = await db
      .update(flowNodes)
      .set(updateData)
      .where(eq(flowNodes.id, id))
      .returning();
    
    if (!updatedNode) {
      throw new Error(`Flow node with id ${id} not found`);
    }
    
    return updatedNode;
  }

  async deleteFlowNode(id: number): Promise<void> {
    await db.delete(flowNodes).where(eq(flowNodes.id, id));
  }
  
  // Settings management
  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async updateSetting(key: string, updateData: UpdateSetting): Promise<Setting> {
    const [updatedSetting] = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.key, key))
      .returning();
    
    if (!updatedSetting) {
      throw new Error(`Setting with key ${key} not found`);
    }
    
    return updatedSetting;
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }
  
  // Customer Journey management
  async getAllCustomerJourneys(): Promise<CustomerJourney[]> {
    return await db.select().from(customerJourneys).orderBy(customerJourneys.updatedAt);
  }

  async getCustomerJourney(id: number): Promise<CustomerJourney | undefined> {
    const [journey] = await db.select().from(customerJourneys).where(eq(customerJourneys.id, id));
    return journey || undefined;
  }

  async createCustomerJourney(insertJourney: InsertCustomerJourney): Promise<CustomerJourney> {
    const [journey] = await db
      .insert(customerJourneys)
      .values(insertJourney)
      .returning();
    return journey;
  }

  async updateCustomerJourney(id: number, updateData: UpdateCustomerJourney): Promise<CustomerJourney> {
    const [updatedJourney] = await db
      .update(customerJourneys)
      .set(updateData)
      .where(eq(customerJourneys.id, id))
      .returning();
    
    if (!updatedJourney) {
      throw new Error(`Customer journey with id ${id} not found`);
    }
    
    return updatedJourney;
  }

  async deleteCustomerJourney(id: number): Promise<void> {
    await db.delete(customerJourneys).where(eq(customerJourneys.id, id));
  }
  
  // Customer management
  async getAllCustomers(): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .orderBy(customers.companyName);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: number, updateData: UpdateCustomer): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    
    if (!updatedCustomer) {
      throw new Error(`Customer with id ${id} not found`);
    }
    
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }
  
  // Helper to seed initial data
  async seedInitialData(): Promise<void> {
    // Seed default settings
    await this.seedDefaultSettings();
    
    // Add sample customers and use cases
    await this.createSampleData();
  }
  
  // Helper to seed default settings
  private async seedDefaultSettings(): Promise<void> {
    const defaultSettings = [
      { key: 'openai.apiKey', value: '' },
      { key: 'openai.systemPrompt', value: 'You are a helpful assistant that responds to customer requests. Your goal is to understand the customer needs and provide clear, concise and helpful responses.' },
      { key: 'openai.userPrompt', value: 'Please respond to the following customer message in a professional and helpful manner:' }
    ];
    
    for (const setting of defaultSettings) {
      const existingSetting = await this.getSetting(setting.key);
      if (!existingSetting) {
        await this.createSetting(setting);
      }
    }
  }
  
  // Helper to create sample data
  private async createSampleData(): Promise<void> {
    // Check if we already have customers
    const existingCustomers = await this.getAllCustomers();
    if (existingCustomers.length > 0) {
      return; // Skip if we already have data
    }
    
    // Create sample customers
    const acmeCustomer = await this.createCustomer({
      companyName: "Acme Corp",
      companyWebsite: "https://acme.example.com",
      primaryContactName: "John Smith",
      primaryContactEmail: "john@acme.example.com",
      primaryContactPhone: "555-123-4567"
    });
    
    const techCorpCustomer = await this.createCustomer({
      companyName: "TechCorp Inc",
      companyWebsite: "https://techcorp.example.com",
      primaryContactName: "Jane Doe",
      primaryContactEmail: "jane@techcorp.example.com",
      primaryContactPhone: "555-987-6543"
    });
    
    const globalCustomer = await this.createCustomer({
      companyName: "Global Enterprises",
      companyWebsite: "https://global.example.com",
      primaryContactName: "Robert Johnson",
      primaryContactEmail: "robert@global.example.com",
      primaryContactPhone: "555-456-7890"
    });
    
    // Create sample use cases
    await this.createUseCase({
      title: "Customer Order Inquiry",
      description: "Agent helps customer track their order status",
      customer: "Acme Corp",
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
    
    await this.createUseCase({
      title: "Product Recommendation",
      description: "Agent helps customer find the right product based on customer needs",
      customer: "TechCorp Inc",
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
    
    await this.createUseCase({
      title: "Account Setup",
      description: "Agent guides new customer through account creation and setup",
      customer: "Global Enterprises",
      conversationFlow: `Customer: I'd like to set up a new account for your service.
Agent: Welcome! I'd be happy to help you set up a new account. To get started, could you please provide your email address?
→
Customer: My email is customer@example.com.
Agent: Thank you. I'll send a verification code to that email address. Once you receive it, please provide the code to me so we can verify your email.
→
Customer: I got the code. It's 123456.
Agent: Perfect! Your email has been verified. Now, let's create a password for your account. Please choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and a special character.
→
Customer: I've chosen a password.
Agent: Great! Your account has been created. Now, I'll guide you through setting up your profile. Could you please provide your full name and company name?
→
Customer: My name is Alex Johnson and I work for Global Enterprises.
Agent: Thank you, Alex. Your profile has been updated. Would you like to set up billing information now, or would you prefer to do that later?
→
Customer: I'll set up billing now.
Agent: Excellent. Please provide your credit card information, including the card number, expiration date, CVV, and billing address.`
    });
    
    // Create sample journeys
    const sampleNodes = [
      {
        id: 'entry',
        type: 'journeyNode',
        data: { 
          stepType: 'entry',
          title: "Customer Inquiry",
          description: "Customer contacts support with an issue or question"
        },
        position: { x: 100, y: 150 }
      },
      {
        id: 'identification',
        type: 'journeyNode',
        data: { 
          stepType: 'evaluation',
          title: "Issue Identification",
          description: "Agent works with customer to identify the specific issue"
        },
        position: { x: 350, y: 150 }
      },
      {
        id: 'resolution',
        type: 'journeyNode',
        data: { 
          stepType: 'support',
          title: "Resolution Process",
          description: "Agent provides solution or escalates if needed"
        },
        position: { x: 600, y: 150 }
      }
    ];
    
    const sampleEdges = [
      {
        id: 'e-entry-identification',
        source: 'entry',
        target: 'identification',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#2563eb' }
      },
      {
        id: 'e-identification-resolution',
        source: 'identification',
        target: 'resolution',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#2563eb' }
      }
    ];
    
    await this.createCustomerJourney({
      title: "Simple Support Journey",
      customerName: "Acme Corp",
      workflowIntent: "Customer support workflow for product issues",
      notes: "Basic support journey for handling common customer issues",
      summary: "A streamlined customer support journey from initial contact to resolution",
      nodes: sampleNodes,
      edges: sampleEdges
    });
  }
}