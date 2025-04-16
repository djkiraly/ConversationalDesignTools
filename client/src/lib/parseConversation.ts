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
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.toLowerCase() === 'customer:') {
        // Found a customer label on its own line
        currentRole = 'customer';
        // Collect all subsequent lines until we hit the next label or end
        let j = i + 1;
        while (j < lines.length && 
               !lines[j].toLowerCase().startsWith('customer:') && 
               !lines[j].toLowerCase().startsWith('agent:') &&
               lines[j].trim() !== '') {
          customerText += lines[j].trim() + ' ';
          j++;
        }
        // Skip the lines we've just processed
        i = j - 1;
      } else if (line.toLowerCase() === 'agent:') {
        // Found an agent label on its own line
        currentRole = 'agent';
        // Collect all subsequent lines until we hit the next label or end
        let j = i + 1;
        while (j < lines.length && 
               !lines[j].toLowerCase().startsWith('customer:') && 
               !lines[j].toLowerCase().startsWith('agent:') &&
               lines[j].trim() !== '') {
          agentText += lines[j].trim() + ' ';
          j++;
        }
        // Skip the lines we've just processed
        i = j - 1;
      } else if (line.toLowerCase().startsWith('customer:')) {
        // Legacy format with text on same line as label
        currentRole = 'customer';
        customerText += line.substring(line.indexOf(':') + 1).trim() + ' ';
      } else if (line.toLowerCase().startsWith('agent:')) {
        // Legacy format with text on same line as label
        currentRole = 'agent';
        agentText += line.substring(line.indexOf(':') + 1).trim() + ' ';
      } else if (line.trim() !== '' && currentRole === 'customer') {
        // Continuation of customer text
        customerText += line.trim() + ' ';
      } else if (line.trim() !== '' && currentRole === 'agent') {
        // Continuation of agent text
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
