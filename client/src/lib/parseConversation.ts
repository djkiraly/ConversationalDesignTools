import { ParsedFlow, ConversationPair } from '@shared/schema';

/**
 * Parse a conversation flow text into structured data
 * 
 * Format expectations:
 * - Customer: [text]
 * - Agent: [text]
 * - → (arrow) indicates a new flow step
 */
interface RawConversationSegment {
  role: string;
  text: string;
}

/**
 * Parses a conversation flow text into structured data,
 * strictly respecting the format with Customer/Agent labels
 * and arrow (→) step separators
 */
export function parseConversationFlow(text: string): ParsedFlow {
  if (!text || text.trim() === '') {
    return { pairs: [] };
  }

  // Split the text by arrow symbols to get conversation steps
  const steps = text.split('→').map(step => step.trim()).filter(Boolean);
  
  // Create a more accurate conversation pair from each step
  const pairs: ConversationPair[] = steps.map((step, stepIndex) => {
    // First, extract all segments with their roles in order
    const segments: RawConversationSegment[] = [];
    const lines = step.split('\n');
    let currentRole = '';
    let currentText = '';
    
    // Process each line to identify roles and collect text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for role labels (exact match or starting with)
      if (line.toLowerCase() === 'customer:') {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        
        // Start collecting for the new role
        currentRole = 'customer';
        currentText = '';
        
        // Collect all subsequent lines until next role label
        let j = i + 1;
        while (j < lines.length && 
               !lines[j].toLowerCase().startsWith('customer:') && 
               !lines[j].toLowerCase().startsWith('agent:')) {
          if (lines[j].trim()) {
            currentText += lines[j].trim() + ' ';
          }
          j++;
        }
        // Save what we collected and skip processed lines
        if (currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      } 
      else if (line.toLowerCase() === 'agent:') {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        
        // Start collecting for the new role
        currentRole = 'agent';
        currentText = '';
        
        // Collect all subsequent lines until next role label
        let j = i + 1;
        while (j < lines.length && 
               !lines[j].toLowerCase().startsWith('customer:') && 
               !lines[j].toLowerCase().startsWith('agent:')) {
          if (lines[j].trim()) {
            currentText += lines[j].trim() + ' ';
          }
          j++;
        }
        // Save what we collected and skip processed lines
        if (currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      }
      else if (line.toLowerCase().startsWith('customer:')) {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        
        // Legacy format with text on same line
        currentRole = 'customer';
        currentText = line.substring(line.indexOf(':') + 1).trim() + ' ';
        
        // Collect any continuation lines
        let j = i + 1;
        while (j < lines.length && 
               !lines[j].toLowerCase().startsWith('customer:') && 
               !lines[j].toLowerCase().startsWith('agent:')) {
          if (lines[j].trim()) {
            currentText += lines[j].trim() + ' ';
          }
          j++;
        }
        // Save what we collected and skip processed lines
        if (currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      }
      else if (line.toLowerCase().startsWith('agent:')) {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        
        // Legacy format with text on same line
        currentRole = 'agent';
        currentText = line.substring(line.indexOf(':') + 1).trim() + ' ';
        
        // Collect any continuation lines
        let j = i + 1;
        while (j < lines.length && 
               !lines[j].toLowerCase().startsWith('customer:') && 
               !lines[j].toLowerCase().startsWith('agent:')) {
          if (lines[j].trim()) {
            currentText += lines[j].trim() + ' ';
          }
          j++;
        }
        // Save what we collected and skip processed lines
        if (currentText) {
          segments.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      }
    }
    
    // If there's any remaining text, add it
    if (currentRole && currentText) {
      segments.push({ role: currentRole, text: currentText.trim() });
    }
    
    // Now organize segments into customer and agent messages
    // We'll use the last segment of each role if there are multiples
    let customerText = "(No customer message)";
    let agentText = "(No agent response)";
    
    // Find the last segment for each role
    for (const segment of segments) {
      if (segment.role === 'customer' && segment.text) {
        customerText = segment.text;
      } else if (segment.role === 'agent' && segment.text) {
        agentText = segment.text;
      }
    }
    
    // Create a standardized step type based on position and content
    let stepType = "Conversation Step";
    if (stepIndex === 0) {
      stepType = "Customer Inquiry";
    } else if (stepIndex === steps.length - 1) {
      stepType = "Completion";
    }
    
    return {
      customer: customerText,
      agent: agentText,
      stepType
    };
  });
  
  // Only include pairs with at least one valid message
  return {
    pairs: pairs.filter(pair => 
      (pair.customer && pair.customer !== "(No customer message)") || 
      (pair.agent && pair.agent !== "(No agent response)")
    )
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
