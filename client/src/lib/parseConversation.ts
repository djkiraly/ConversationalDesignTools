import { ParsedFlow, Message, ConversationStep } from '@shared/schema';

/**
 * Parse a conversation flow text into structured data
 * 
 * Format expectations:
 * - Customer: [text]
 * - Agent: [text]
 * - → (arrow) indicates a new flow step
 */

/**
 * Parses a conversation flow text into structured data,
 * strictly respecting the format with Customer/Agent labels
 * and arrow (→) step separators
 */
export function parseConversationFlow(text: string): ParsedFlow {
  if (!text || text.trim() === '') {
    return { steps: [] };
  }

  // Split the text by arrow symbols to get conversation steps
  const rawSteps = text.split('→').map(step => step.trim()).filter(Boolean);
  
  // Parse each step maintaining the order of messages
  const steps: ConversationStep[] = rawSteps.map((stepText, stepIndex) => {
    // Extract all messages in the exact order they appear
    const messages: Message[] = [];
    const lines = stepText.split('\n');
    let currentRole = '';
    let currentText = '';
    
    // Process each line to identify roles and collect text
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for role labels (exact match)
      if (line.toLowerCase() === 'customer:') {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
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
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      } 
      else if (line.toLowerCase() === 'agent:') {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
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
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      }
      // Check for role labels with text on same line
      else if (line.toLowerCase().startsWith('customer:')) {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        
        // Format with text on same line
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
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      }
      else if (line.toLowerCase().startsWith('agent:')) {
        // If we were collecting text for a previous role, save it
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        
        // Format with text on same line
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
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        i = j - 1;
        currentText = '';
      }
    }
    
    // If there's any remaining text, add it
    if (currentRole && currentText) {
      messages.push({ role: currentRole, text: currentText.trim() });
    }
    
    // Create a standardized step type based on position and content
    let stepType = "Conversation Step";
    if (stepIndex === 0) {
      stepType = "Customer Inquiry";
    } else if (stepIndex === rawSteps.length - 1) {
      stepType = "Completion";
    }
    
    // Return the step with messages in their original order
    return {
      messages,
      stepType,
      stepNumber: stepIndex + 1
    };
  });
  
  // Only include steps with at least one valid message
  return {
    steps: steps.filter(step => step.messages.length > 0)
  };
}

/**
 * Parse a conversation flow text and detect step types
 * This is a more advanced version for future enhancement
 */
export function parseConversationFlowWithTypes(text: string): ParsedFlow {
  const basicParsed = parseConversationFlow(text);
  
  // Enhance with step type detection
  const enhancedSteps = basicParsed.steps.map((step, index, allSteps) => {
    // Extract text for all messages to analyze content
    const allText = step.messages.map(msg => msg.text).join(' ').toLowerCase();
    
    // First step is usually an inquiry
    if (index === 0) {
      return { ...step, stepType: "Customer Inquiry" };
    }
    
    // Last step is usually completion or checkout
    if (index === allSteps.length - 1) {
      return { ...step, stepType: "Completion" };
    }
    
    // Detect step type based on content
    if (allText.includes("price") || allText.includes("cost") || allText.includes("$")) {
      return { ...step, stepType: "Price Inquiry" };
    }
    
    if (allText.includes("buy") || allText.includes("purchase")) {
      return { ...step, stepType: "Purchase Decision" };
    }
    
    if (allText.includes("need") || allText.includes("want") || 
        allText.includes("recommend") || allText.includes("suggest")) {
      return { ...step, stepType: "Requirement Gathering" };
    }
    
    // Default
    return { ...step, stepType: "Conversation Step" };
  });
  
  return {
    steps: enhancedSteps
  };
}
