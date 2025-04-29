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
  // Look for both plain arrows and special typed arrows like "→ [Entry Point]"
  // We'll process the step type during this split
  const rawStepsWithTypes: {text: string, type?: string}[] = [];
  
  // Split on arrow for normal steps, but catch special types in the process
  const rawStepTexts = text.split('→').map(step => step.trim()).filter(Boolean);
  
  // Check for special step types in the step headers
  rawStepTexts.forEach((stepText, index) => {
    // The first line might contain the step type designation
    const lines = stepText.split('\n');
    const firstLine = lines[0].trim();
    
    // Check if first line is a special step designation
    if (firstLine.startsWith('[') && firstLine.endsWith(']')) {
      // Extract the step type from the bracket notation: [Entry Point]
      const stepType = firstLine.substring(1, firstLine.length - 1).trim();
      // Remove the step type line from the text
      const remainingText = lines.slice(1).join('\n').trim();
      rawStepsWithTypes.push({ text: remainingText, type: stepType });
    } else {
      // No special type, just use the step text as is
      rawStepsWithTypes.push({ text: stepText });
    }
  });
  
  // Parse each step maintaining the order of messages
  const steps: ConversationStep[] = rawStepsWithTypes.map((step, stepIndex) => {
    // Extract all messages in the exact order they appear
    const messages: Message[] = [];
    const lines = step.text.split('\n');
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
    
    // Create a standardized step type based on position, content, or explicit type
    let stepType = step.type || "Conversation Step"; // Use provided type if available
    
    // If no explicit type was provided, use the default logic
    if (!step.type) {
      if (stepIndex === 0) {
        stepType = "Customer Inquiry";
      } else if (stepIndex === rawStepsWithTypes.length - 1) {
        stepType = "Completion";
      }
    }
    
    // For special step types, we may have no messages and that's okay
    const isSpecialStepType = ['Entry Point', 'Exit Point', 'Integration', 'Decision Point'].includes(stepType);
    
    // If we have a special step type with no customer/agent messages, still create a valid step
    if (isSpecialStepType && messages.length === 0) {
      return {
        messages: [], // Empty messages array for special step types
        stepType,
        stepNumber: stepIndex + 1
      };
    }
    
    // Return the step with messages in their original order
    return {
      messages,
      stepType,
      stepNumber: stepIndex + 1
    };
  });
  
  // Include steps with at least one valid message OR special step types with no messages
  return {
    steps: steps.filter(step => {
      const stepType = step.stepType || '';
      const isSpecialStepType = ['Entry Point', 'Exit Point', 'Integration', 'Decision Point'].includes(stepType);
      return step.messages.length > 0 || isSpecialStepType;
    })
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
    // Check for special step types - preserve them
    const stepType = step.stepType || '';
    const isSpecialStepType = ['Entry Point', 'Exit Point', 'Integration', 'Decision Point', 'Escalation Point'].includes(stepType);
    if (isSpecialStepType) {
      return step; // Keep special step types as is
    }
    
    // Only analyze content for steps with messages
    if (step.messages && step.messages.length > 0) {
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
    }
    
    // Default
    return { ...step, stepType: step.stepType || "Conversation Step" };
  });
  
  return {
    steps: enhancedSteps
  };
}
