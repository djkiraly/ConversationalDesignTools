import { ParsedFlow, ConversationPair } from '@shared/schema';

/**
 * Parse a conversation flow text into structured data
 * 
 * Format expectations:
 * - Customer: [text]
 * - Agent: [text]
 * - → (arrow) indicates a new flow step
 */
export function parseConversationFlow(text: string): ParsedFlow {
  if (!text || text.trim() === '') {
    return { pairs: [] };
  }

  // Split the text by arrow symbols to get conversation steps
  const steps = text.split('→').map(step => step.trim()).filter(Boolean);
  
  const pairs: ConversationPair[] = steps.map(step => {
    // This is a simpler approach that works in all ES versions
    const lines = step.split('\n');
    let customerText = '';
    let agentText = '';
    
    // Iterate through each line to find customer and agent messages
    let currentRole = '';
    
    for (const line of lines) {
      if (line.toLowerCase().startsWith('customer:')) {
        currentRole = 'customer';
        customerText += line.substring(9).trim() + ' ';
      } else if (line.toLowerCase().startsWith('agent:')) {
        currentRole = 'agent';
        agentText += line.substring(6).trim() + ' ';
      } else if (currentRole === 'customer') {
        customerText += line.trim() + ' ';
      } else if (currentRole === 'agent') {
        agentText += line.trim() + ' ';
      }
    }
    
    return {
      customer: customerText.trim() || "(No customer message)",
      agent: agentText.trim() || "(No agent response)",
    };
  });
  
  // Include all valid conversation steps - only filter out completely empty pairs
  return {
    pairs: pairs.filter(pair => (pair.customer && pair.customer !== "(No customer message)") || 
                              (pair.agent && pair.agent !== "(No agent response)"))
  };
}

/**
 * Parse a conversation flow text and detect step types
 * This is a more advanced version for future enhancement
 */
export function parseConversationFlowWithTypes(text: string): ParsedFlow {
  const basicParsed = parseConversationFlow(text);
  
  // Enhance with step type detection
  const enhancedPairs = basicParsed.pairs.map((pair, index, allPairs) => {
    // First step is usually an inquiry
    if (index === 0) {
      return { ...pair, stepType: "Customer Inquiry" };
    }
    
    // Last step is usually completion or checkout
    if (index === allPairs.length - 1) {
      return { ...pair, stepType: "Completion" };
    }
    
    // Detect step type based on content
    const customerLower = pair.customer.toLowerCase();
    const agentLower = pair.agent.toLowerCase();
    
    if (customerLower.includes("price") || customerLower.includes("cost") || 
        agentLower.includes("price") || agentLower.includes("cost") || 
        agentLower.includes("$")) {
      return { ...pair, stepType: "Price Inquiry" };
    }
    
    if (customerLower.includes("buy") || customerLower.includes("purchase") || 
        agentLower.includes("buy") || agentLower.includes("purchase")) {
      return { ...pair, stepType: "Purchase Decision" };
    }
    
    if (customerLower.includes("need") || customerLower.includes("want") || 
        agentLower.includes("recommend") || agentLower.includes("suggest")) {
      return { ...pair, stepType: "Requirement Gathering" };
    }
    
    // Default
    return { ...pair, stepType: "Conversation Step" };
  });
  
  return {
    pairs: enhancedPairs
  };
}
