import OpenAI from "openai";

// Constants for the OpenAI integration
export const OPENAI_API_KEY_SETTING = 'openai.apiKey';

// Function to validate an OpenAI API key
export async function validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; models?: string[]; error?: string }> {
  try {
    // Initialize the OpenAI client with the provided API key
    const openai = new OpenAI({ apiKey });
    
    // Make a simple request to list models - this will verify if the API key is valid
    const response = await openai.models.list();
    
    // Return success response with available models
    return {
      valid: true,
      models: response.data.map(model => model.id)
    };
  } catch (error: any) {
    // Return error response
    return {
      valid: false,
      error: error.message || 'Failed to validate OpenAI API key'
    };
  }
}

// Get suggestions for use case modification based on title and description
export async function getUseCaseSuggestions(
  apiKey: string, 
  title: string, 
  description: string,
  agentPersona?: string
): Promise<{ 
  success: boolean; 
  suggestions?: { 
    title: string; 
    description: string; 
    conversationFlow?: string;
    agentPersona?: string;
  }; 
  error?: string 
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare the prompt
    let prompt = `You are an expert in designing conversational flows for customer service scenarios. 
Given the following use case title and description, suggest improvements to make it more specific, 
detailed, and effective for a customer service scenario. Respond with JSON format containing ONLY 
an improved title and description. DO NOT include agent persona or conversation flow in your response.

Current Title: "${title}"
Current Description: "${description}"`;

    // Include agent persona if available (as reference only)
    if (agentPersona) {
      prompt += `\nCurrent Agent Persona (for reference only, do not modify): "${agentPersona}"`;
    }

    prompt += `\n
Provide suggestions in this JSON format:
{
  "title": "Improved title here",
  "description": "Improved detailed description here"
}

The title should be concise but descriptive (maximum 5-7 words). 
The description should provide context and goals, be comprehensive but concise (2-3 sentences maximum).
IMPORTANT: Do not include "agentPersona" or "conversationFlow" fields in your response.`;

    // Make a request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI expert in designing customer service conversation flows." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    const suggestions = JSON.parse(content || '{}');
    
    return { 
      success: true,
      suggestions
    };
  } catch (error: any) {
    // Handle errors from the OpenAI API
    return {
      success: false,
      error: error.message || "Failed to get suggestions"
    };
  }
}

// Get suggestions for agent persona based on title and description
export async function getConversationFlowSuggestion(
  apiKey: string, 
  title: string, 
  description: string,
  currentFlow: string,
  agentPersona: string,
  additionalInstructions?: string
): Promise<{ 
  success: boolean; 
  suggestion?: string;
  error?: string 
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare the prompt
    let prompt = `You are an expert in conversational AI design and flow optimization. 
Review the following conversation flow between a Customer and an Agent. 
Suggest improvements to make the conversation more natural, effective, and helpful.

Use Case Title: "${title}"
Use Case Description: "${description}"
Agent Persona: "${agentPersona}"

Current Conversation Flow:
\`\`\`
${currentFlow}
\`\`\`

Please analyze this conversation flow and provide an improved version that:
1. Maintains the same general structure and purpose
2. Makes dialogue more natural and conversational
3. Ensures the agent's responses align with the provided Agent Persona
4. Improves clarity and addresses potential points of confusion
5. Adds appropriate follow-up questions or clarifications where needed
6. Enhances the logical flow between conversation steps`;

    // Add additional instructions if provided
    if (additionalInstructions && additionalInstructions.trim() !== '') {
      prompt += `\n\nADDITIONAL INSTRUCTIONS:
${additionalInstructions}`;
    }

    prompt += `\n\nReturn ONLY the improved conversation flow in the same format with Customer/Agent labels and → arrows for step separation.
Do not include explanations or analysis - just provide the complete improved flow.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert in conversational AI design and natural dialogue patterns." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const suggestion = response.choices[0].message.content?.trim();
    
    if (!suggestion) {
      throw new Error('No suggestion was generated');
    }
    
    return { 
      success: true, 
      suggestion
    };
  } catch (error: any) {
    console.error('Error getting conversation flow suggestion:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate conversation flow suggestion'
    };
  }
}

// Generate a summary for a customer journey based on its metadata and nodes
export async function generateJourneySummary(
  apiKey: string,
  journey: {
    title: string;
    customerName?: string;
    workflowIntent?: string;
    notes?: string;
    nodes: any[];
  }
): Promise<{
  success: boolean;
  summary?: string;
  error?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Extract node information
    const nodeInfo = journey.nodes.map((node: any) => ({
      type: node.data?.stepType || 'Unknown',
      title: node.data?.title || 'Untitled Node',
      description: node.data?.description || ''
    }));
    
    // Prepare the prompt
    const prompt = `You are an expert in analyzing customer journey maps and workflow processes.
Based on the following customer journey information, generate a concise and informative summary (100-150 words).

Journey Title: "${journey.title}"
${journey.customerName ? `Customer Name: "${journey.customerName}"` : ''}
${journey.workflowIntent ? `Workflow Intent: "${journey.workflowIntent}"` : ''}
${journey.notes ? `Notes: "${journey.notes}"` : ''}

Journey Flow Nodes:
${nodeInfo.map((node: any, index: number) => 
  `${index + 1}. ${node.type}: "${node.title}" - ${node.description}`
).join('\n')}

The summary should:
1. Capture the main purpose of this customer journey
2. Identify the key stages in the workflow
3. Highlight any important aspects of the customer experience
4. Be written in clear, professional language
5. Be useful for someone who needs a quick understanding of this journey flow

Your summary should be a single paragraph without bullet points or numbered lists.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert in customer experience analysis and workflow optimization." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const summary = response.choices[0].message.content?.trim();
    
    if (!summary) {
      throw new Error('No summary was generated');
    }
    
    return {
      success: true,
      summary
    };
  } catch (error: any) {
    console.error('Error generating journey summary:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate journey summary'
    };
  }
}

// Generate a complete journey flow based on a description
export async function generateAIJourney(
  apiKey: string,
  description: string
): Promise<{
  success: boolean;
  journey?: {
    nodes: any[];
    edges: any[];
  };
  error?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare the prompt
    const prompt = `You are an expert in designing customer journey maps. Create a detailed customer journey based on the following description:

Description: "${description}"

Generate a complete customer journey map with appropriate stages that makes sense for this scenario. 
Each step should have a type, title, and brief description.

Respond with JSON in the following format:
{
  "steps": [
    {
      "id": "node1",
      "type": "Entry Point",
      "title": "Step Title",
      "description": "Brief description of this step"
    },
    ... more steps ...
  ],
  "connections": [
    { 
      "source": "node1", 
      "target": "node2" 
    },
    ... more connections ...
  ]
}

The journey should have 5-8 logical steps. Each step should have a descriptive title and a concise description.
Valid step types include: "Entry Point", "Awareness", "Research", "Consideration", "Evaluation", "Decision", "Purchase", "Onboarding", "Support", "Feedback", "Retention".
Connections should form a logical flow from one step to the next.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert in customer experience design and journey mapping." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No journey was generated');
    }
    
    const journeyData = JSON.parse(content);
    
    // Transform the returned data into ReactFlow nodes and edges
    const nodes: any[] = journeyData.steps.map((step: any, index: number) => {
      // Calculate position - place nodes in a horizontal line
      const position = {
        x: 100 + (index * 250),
        y: 100
      };
      
      return {
        id: step.id,
        type: 'journeyNode',
        data: {
          stepType: step.type,
          title: step.title,
          description: step.description
        },
        position
      };
    });
    
    const edges: any[] = journeyData.connections.map((connection: any, index: number) => ({
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#2563eb' },
      markerEnd: {
        type: 'arrow',
        color: '#2563eb',
      }
    }));
    
    return {
      success: true,
      journey: {
        nodes,
        edges
      }
    };
  } catch (error: any) {
    console.error('Error generating AI journey:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate AI journey'
    };
  }
}

export async function getAgentPersonaSuggestion(
  apiKey: string, 
  title: string, 
  description: string,
  currentPersona?: string
): Promise<{ 
  success: boolean; 
  suggestion?: string;
  error?: string 
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare the prompt
    let prompt = `You are an expert in designing conversational AI agent personas. 
Given the following use case title and description, suggest a detailed agent persona 
that would be effective for this scenario. The agent persona should define the tone, 
personality, knowledge areas, and behavior of the AI assistant when interacting with users.

Current Title: "${title}"
Current Description: "${description}"`;

    // Include current persona if available
    if (currentPersona && currentPersona.trim() !== '') {
      prompt += `\nCurrent Agent Persona: "${currentPersona}"
      
Analyze the current persona and suggest improvements or an alternative approach that might 
better serve this use case. If the current persona is already good, enhance it with additional details.`;
    }

    prompt += `\n
Create a comprehensive agent persona that includes:
1. The agent's personality traits (friendly, professional, empathetic, etc.)
2. Communication style and tone of voice
3. Level of formality
4. Key knowledge areas relevant to the use case
5. How the agent should handle difficult situations or questions
6. Any specific phrases or language patterns the agent should use

Provide a cohesive paragraph (200-300 words) that covers these aspects and creates a clear 
picture of how the agent should interact with users.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert in creating effective agent personas for conversational AI assistants." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const suggestion = response.choices[0].message.content?.trim();
    
    if (!suggestion) {
      throw new Error('No suggestion was generated');
    }
    
    return { 
      success: true, 
      suggestion
    };
  } catch (error: any) {
    console.error('Error getting agent persona suggestion:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate agent persona suggestion'
    };
  }
}