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
    const customerMatch = step.match(/Customer:(.*?)(?=Agent:|$)/s);
    const agentMatch = step.match(/Agent:(.*?)(?=Customer:|$)/s);
    
    const customerText = customerMatch ? customerMatch[1].trim() : '';
    const agentText = agentMatch ? agentMatch[1].trim() : '';
    
    return {
      customer: customerText,
      agent: agentText,
    };
  });
  
  // Filter out pairs that don't have both customer and agent text
  return {
    pairs: pairs.filter(pair => pair.customer && pair.agent)
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
