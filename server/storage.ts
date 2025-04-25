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

// Storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Use case management
  getAllUseCases(): Promise<UseCase[]>;
  getUseCase(id: number): Promise<UseCase | undefined>;
  createUseCase(useCase: InsertUseCase): Promise<UseCase>;
  updateUseCase(id: number, useCase: UpdateUseCase): Promise<UseCase>;
  deleteUseCase(id: number): Promise<void>;
  
  // Flow node management (for potential future feature)
  getFlowNodesForUseCase(useCaseId: number): Promise<FlowNode[]>;
  createFlowNode(flowNode: InsertFlowNode): Promise<FlowNode>;
  updateFlowNode(id: number, flowNode: Partial<FlowNode>): Promise<FlowNode>;
  deleteFlowNode(id: number): Promise<void>;
  
  // Settings management
  getAllSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, setting: UpdateSetting): Promise<Setting>;
  deleteSetting(key: string): Promise<void>;
  
  // Customer Journey management
  getAllCustomerJourneys(): Promise<CustomerJourney[]>;
  getCustomerJourney(id: number): Promise<CustomerJourney | undefined>;
  createCustomerJourney(journey: InsertCustomerJourney): Promise<CustomerJourney>;
  updateCustomerJourney(id: number, journey: UpdateCustomerJourney): Promise<CustomerJourney>;
  deleteCustomerJourney(id: number): Promise<void>;
  
  // Customer management
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: UpdateCustomer): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  
  // Action Plan management
  getAllActionPlans(): Promise<ActionPlan[]>;
  getActionPlan(id: number): Promise<ActionPlan | undefined>;
  createActionPlan(actionPlan: InsertActionPlan): Promise<ActionPlan>;
  updateActionPlan(id: number, actionPlan: UpdateActionPlan): Promise<ActionPlan>;
  deleteActionPlan(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private useCases: Map<number, UseCase>;
  private flowNodes: Map<number, FlowNode>;
  private settings: Map<string, Setting>;
  private customerJourneys: Map<number, CustomerJourney>;
  private customers: Map<number, Customer>;
  private actionPlans: Map<number, ActionPlan>;
  
  private userCurrentId: number;
  private useCaseCurrentId: number;
  private flowNodeCurrentId: number;
  private settingCurrentId: number;
  private customerJourneyCurrentId: number;
  private customerCurrentId: number;
  private actionPlanCurrentId: number;

  constructor() {
    this.users = new Map();
    this.useCases = new Map();
    this.flowNodes = new Map();
    this.settings = new Map();
    this.customerJourneys = new Map();
    this.customers = new Map();
    
    this.userCurrentId = 1;
    this.useCaseCurrentId = 1;
    this.flowNodeCurrentId = 1;
    this.settingCurrentId = 1;
    this.customerJourneyCurrentId = 1;
    this.customerCurrentId = 1;
    
    // Add some sample use cases for testing
    this.addSampleUseCases();
    
    // Add default settings
    this.addDefaultSettings();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Use case methods
  async getAllUseCases(): Promise<UseCase[]> {
    return Array.from(this.useCases.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getUseCase(id: number): Promise<UseCase | undefined> {
    return this.useCases.get(id);
  }

  async createUseCase(insertUseCase: InsertUseCase): Promise<UseCase> {
    const id = this.useCaseCurrentId++;
    const now = new Date();
    const useCase: UseCase = {
      id,
      title: insertUseCase.title,
      description: insertUseCase.description ?? null,
      customer: insertUseCase.customer ?? null,
      conversationFlow: insertUseCase.conversationFlow,
      nodePositions: insertUseCase.nodePositions ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.useCases.set(id, useCase);
    return useCase;
  }

  async updateUseCase(id: number, updateData: UpdateUseCase): Promise<UseCase> {
    const existingUseCase = this.useCases.get(id);
    if (!existingUseCase) {
      throw new Error(`Use case with id ${id} not found`);
    }
    
    // Properly handle the customer field, preserving it if not provided in the update
    const customer = updateData.customer !== undefined 
      ? updateData.customer 
      : existingUseCase.customer;
    
    const updatedUseCase: UseCase = {
      ...existingUseCase,
      ...updateData,
      customer,
      updatedAt: new Date()
    };
    
    this.useCases.set(id, updatedUseCase);
    return updatedUseCase;
  }

  async deleteUseCase(id: number): Promise<void> {
    this.useCases.delete(id);
    // Also delete associated flow nodes
    Array.from(this.flowNodes.entries()).forEach(([nodeId, node]) => {
      if (node.useCaseId === id) {
        this.flowNodes.delete(nodeId);
      }
    });
  }

  // Flow node methods
  async getFlowNodesForUseCase(useCaseId: number): Promise<FlowNode[]> {
    return Array.from(this.flowNodes.values())
      .filter(node => node.useCaseId === useCaseId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  async createFlowNode(insertFlowNode: InsertFlowNode): Promise<FlowNode> {
    const id = this.flowNodeCurrentId++;
    const flowNode: FlowNode = { 
      id,
      useCaseId: insertFlowNode.useCaseId,
      stepNumber: insertFlowNode.stepNumber,
      customerText: insertFlowNode.customerText,
      agentText: insertFlowNode.agentText,
      stepType: insertFlowNode.stepType ?? null,
      nextNodeId: insertFlowNode.nextNodeId ?? null,
      positionX: insertFlowNode.positionX ?? null,
      positionY: insertFlowNode.positionY ?? null
    };
    this.flowNodes.set(id, flowNode);
    return flowNode;
  }

  async updateFlowNode(id: number, updateData: Partial<FlowNode>): Promise<FlowNode> {
    const existingNode = this.flowNodes.get(id);
    if (!existingNode) {
      throw new Error(`Flow node with id ${id} not found`);
    }
    
    const updatedNode: FlowNode = {
      ...existingNode,
      ...updateData
    };
    
    this.flowNodes.set(id, updatedNode);
    return updatedNode;
  }

  async deleteFlowNode(id: number): Promise<void> {
    this.flowNodes.delete(id);
  }
  
  // Settings methods
  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const id = this.settingCurrentId++;
    const now = new Date();
    const setting: Setting = {
      ...insertSetting,
      id,
      value: insertSetting.value ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.settings.set(setting.key, setting);
    return setting;
  }

  async updateSetting(key: string, updateData: UpdateSetting): Promise<Setting> {
    const existingSetting = this.settings.get(key);
    if (!existingSetting) {
      throw new Error(`Setting with key '${key}' not found`);
    }
    
    const updatedSetting: Setting = {
      ...existingSetting,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.settings.set(key, updatedSetting);
    return updatedSetting;
  }

  async deleteSetting(key: string): Promise<void> {
    this.settings.delete(key);
  }

  // Customer Journey methods
  async getAllCustomerJourneys(): Promise<CustomerJourney[]> {
    return Array.from(this.customerJourneys.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getCustomerJourney(id: number): Promise<CustomerJourney | undefined> {
    return this.customerJourneys.get(id);
  }

  async createCustomerJourney(insertJourney: InsertCustomerJourney): Promise<CustomerJourney> {
    const id = this.customerJourneyCurrentId++;
    const now = new Date();
    const journey: CustomerJourney = {
      id,
      title: insertJourney.title,
      customerName: insertJourney.customerName || null,
      workflowIntent: insertJourney.workflowIntent || null,
      notes: insertJourney.notes || null,
      summary: insertJourney.summary || null,
      nodes: insertJourney.nodes,
      edges: insertJourney.edges,
      createdAt: now,
      updatedAt: now
    };
    this.customerJourneys.set(id, journey);
    return journey;
  }

  async updateCustomerJourney(id: number, updateData: UpdateCustomerJourney): Promise<CustomerJourney> {
    const existingJourney = this.customerJourneys.get(id);
    if (!existingJourney) {
      throw new Error(`Customer journey with id ${id} not found`);
    }
    
    const updatedJourney: CustomerJourney = {
      ...existingJourney,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.customerJourneys.set(id, updatedJourney);
    return updatedJourney;
  }

  async deleteCustomerJourney(id: number): Promise<void> {
    this.customerJourneys.delete(id);
  }
  
  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).sort((a, b) => 
      a.companyName.localeCompare(b.companyName)
    );
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerCurrentId++;
    const now = new Date();
    const customer: Customer = {
      id,
      companyName: insertCustomer.companyName,
      companyWebsite: insertCustomer.companyWebsite || null,
      primaryContactName: insertCustomer.primaryContactName,
      primaryContactPhone: insertCustomer.primaryContactPhone || null,
      primaryContactEmail: insertCustomer.primaryContactEmail,
      createdAt: now,
      updatedAt: now
    };
    this.customers.set(id, customer);
    return customer;
  }
  
  async updateCustomer(id: number, updateData: UpdateCustomer): Promise<Customer> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) {
      throw new Error(`Customer with id ${id} not found`);
    }
    
    const updatedCustomer: Customer = {
      ...existingCustomer,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<void> {
    this.customers.delete(id);
  }
  
  // Helper method to add default settings
  private addDefaultSettings(): void {
    const defaultSettings = [
      { key: 'openai_api_key', value: '' },
      { key: 'openai_system_prompt', value: 'You are a helpful assistant that responds to customer requests. Your goal is to understand the customer needs and provide clear, concise and helpful responses.' },
      { key: 'openai_user_prompt', value: 'Please respond to the following customer message in a professional and helpful manner:' }
    ];

    for (const setting of defaultSettings) {
      this.createSetting(setting);
    }
  }
  
  // Helper method to add sample data
  private addSampleUseCases() {
    // First, make sure we have some sample customers
    const acmeCustomer = this.createCustomer({
      companyName: "Acme Corp",
      companyWebsite: "https://acme.example.com",
      primaryContactName: "John Smith",
      primaryContactEmail: "john@acme.example.com",
      primaryContactPhone: "555-123-4567"
    });
    
    const techCorpCustomer = this.createCustomer({
      companyName: "TechCorp Inc",
      companyWebsite: "https://techcorp.example.com",
      primaryContactName: "Jane Doe",
      primaryContactEmail: "jane@techcorp.example.com",
      primaryContactPhone: "555-987-6543"
    });
    
    const globalCustomer = this.createCustomer({
      companyName: "Global Enterprises",
      companyWebsite: "https://global.example.com",
      primaryContactName: "Robert Johnson",
      primaryContactEmail: "robert@global.example.com",
      primaryContactPhone: "555-456-7890"
    });
    
    // Sample use case 1: Customer Order Inquiry
    this.createUseCase({
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
    
    // Sample use case 2: Product Recommendation
    this.createUseCase({
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
    
    // Sample use case 3: Account Setup
    this.createUseCase({
      title: "Account Setup",
      description: "Agent guides new customer through account creation and setup",
      customer: "Global Enterprises",
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

// Export storage interface for implementation
// Note: The actual implementation is set in a separate file to avoid circular imports
export let storage: IStorage;

// Function to set the storage implementation (called from index.ts)
export function setStorage(impl: IStorage) {
  storage = impl;
}

// Seed initial data into the database
export async function seedInitialData() {
  if (!storage) {
    throw new Error('Storage not initialized');
  }
  
  if ('seedInitialData' in storage) {
    // If the storage has a seedInitialData method, call it
    await (storage as any).seedInitialData();
  }
}