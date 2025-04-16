import { 
  users, 
  useCases, 
  flowNodes, 
  type User, 
  type InsertUser, 
  type UseCase, 
  type InsertUseCase, 
  type UpdateUseCase,
  type FlowNode,
  type InsertFlowNode
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private useCases: Map<number, UseCase>;
  private flowNodes: Map<number, FlowNode>;
  
  private userCurrentId: number;
  private useCaseCurrentId: number;
  private flowNodeCurrentId: number;

  constructor() {
    this.users = new Map();
    this.useCases = new Map();
    this.flowNodes = new Map();
    
    this.userCurrentId = 1;
    this.useCaseCurrentId = 1;
    this.flowNodeCurrentId = 1;
    
    // Add some sample use cases for testing
    this.addSampleUseCases();
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
      ...insertUseCase,
      id,
      description: insertUseCase.description ?? null,
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
    
    const updatedUseCase: UseCase = {
      ...existingUseCase,
      ...updateData,
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
      ...insertFlowNode, 
      id,
      stepType: insertFlowNode.stepType ?? null,
      nextNodeId: insertFlowNode.nextNodeId ?? null
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
  
  // Helper method to add sample data
  private addSampleUseCases() {
    // Sample use case 1: Customer Order Inquiry
    this.createUseCase({
      title: "Customer Order Inquiry",
      description: "Agent helps customer track their order status",
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

export const storage = new MemStorage();
