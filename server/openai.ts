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
  additionalInstructions?: string,
  useCase?: any // Additional use case details
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
Agent Persona: "${agentPersona}"`;

    // Add detailed use case information if available
    if (useCase) {
      prompt += `\n
Detailed Use Case Information:
- Problem Statement: ${useCase.problemStatement || 'Not specified'}
- Proposed Solution: ${useCase.proposedSolution || 'Not specified'}
- Key Objectives: ${useCase.keyObjectives || 'Not specified'}
- Required Data Inputs: ${useCase.requiredDataInputs || 'Not specified'}
- Expected Outputs: ${useCase.expectedOutputs || 'Not specified'}
- Key Stakeholders: ${useCase.keyStakeholders || 'Not specified'}
- Scope: ${useCase.scope || 'Not specified'}
- Potential Risks: ${useCase.potentialRisks || 'Not specified'}
- Estimated Impact: ${useCase.estimatedImpact || 'Not specified'}`;
    }

    prompt += `\n
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
6. Enhances the logical flow between conversation steps
7. Incorporates relevant aspects from the detailed use case information (if provided)`;

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

// Generate suggestions for improving an action plan
// Generate action plan from use case data
export async function generateActionPlanFromUseCase(
  apiKey: string,
  useCase: {
    id: number;
    title: string;
    description?: string | null;
    customer?: string | null;
    problemStatement?: string | null;
    proposedSolution?: string | null;
    keyObjectives?: string | null;
    requiredDataInputs?: string | null;
    expectedOutputs?: string | null;
    keyStakeholders?: string | null;
    scope?: string | null;
    potentialRisks?: string | null;
    estimatedImpact?: string | null;
  }
): Promise<{
  success: boolean;
  actionPlan?: {
    title: string;
    industry: string;
    primaryChannel: string;
    interactionVolume: string;
    currentAutomation: string;
    biggestChallenge: string;
    repetitiveProcesses: string;
    aiGoals: string[];
    autonomyLevel: string;
    currentPlatforms: string;
    teamComfort: string;
    apisAvailable: string;
    successMetrics: string[];
  };
  error?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Format the use case data for the prompt
    const useCaseData = {
      id: useCase.id,
      title: useCase.title,
      description: useCase.description || "Not provided",
      customer: useCase.customer || "Not specified",
      problemStatement: useCase.problemStatement || "Not provided",
      proposedSolution: useCase.proposedSolution || "Not provided",
      keyObjectives: useCase.keyObjectives || "Not provided",
      requiredDataInputs: useCase.requiredDataInputs || "Not provided",
      expectedOutputs: useCase.expectedOutputs || "Not provided",
      keyStakeholders: useCase.keyStakeholders || "Not provided",
      scope: useCase.scope || "Not provided",
      potentialRisks: useCase.potentialRisks || "Not provided",
      estimatedImpact: useCase.estimatedImpact || "Not provided"
    };
    
    const prompt = `
You are an AI deployment specialist. You need to create an action plan based on the provided use case. The plan should be focused on implementing conversational AI.

USE CASE INFORMATION:
- Title: ${useCaseData.title}
- Description: ${useCaseData.description}
- Customer: ${useCaseData.customer}
- Problem Statement: ${useCaseData.problemStatement}
- Proposed AI Solution: ${useCaseData.proposedSolution}
- Key Objectives: ${useCaseData.keyObjectives}
- Required Data Inputs: ${useCaseData.requiredDataInputs}
- Expected Outputs: ${useCaseData.expectedOutputs}
- Key Stakeholders: ${useCaseData.keyStakeholders}
- Scope: ${useCaseData.scope}
- Potential Risks: ${useCaseData.potentialRisks}
- Estimated Impact: ${useCaseData.estimatedImpact}

Based on this information, generate a complete action plan with the following sections:
1. Industry - Infer the industry from the context
2. Primary Customer Interaction Channel - What would be the main channel for this solution? (chat, voice, email, etc)
3. Estimated Monthly Interaction Volume - Provide a reasonable estimate based on the context
4. Current Automation Level - Infer from the problem statement
5. Biggest Challenge the organization is facing
6. Repetitive Processes that could be automated
7. AI Goals (list 3-5 specific goals as an array) - These should be specific and achievable
8. Recommended Autonomy Level - (supervised, semi-autonomous, or fully autonomous)
9. Current Platforms being used (infer from the case)
10. Team Readiness - "yes" if team seems ready for AI, "no" if training would be required
11. APIs Availability - "yes" if data seems readily available through APIs, "no" otherwise
12. Success Metrics (list 3-5 specific metrics as an array) - These should be measurable KPIs

Format your response as a JSON object with the following structure:
{
  "title": string, // A good title for the action plan
  "industry": string,
  "primaryChannel": string,
  "interactionVolume": string,
  "currentAutomation": string,
  "biggestChallenge": string,
  "repetitiveProcesses": string,
  "aiGoals": string[], // Array of goal statements
  "autonomyLevel": string,
  "currentPlatforms": string,
  "teamComfort": string, // "yes" or "no"
  "apisAvailable": string, // "yes" or "no"
  "successMetrics": string[] // Array of metric statements
}

Keep all suggestions grounded in the information provided in the use case, making reasonable inferences where needed.
`;

    // Call the OpenAI API with the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI implementation specialist who helps create action plans for AI deployment projects." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const actionPlan = JSON.parse(content);
    
    return {
      success: true,
      actionPlan
    };
  } catch (error: any) {
    console.error('Error generating action plan from use case:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate action plan from use case'
    };
  }
}

export async function generateActionPlanSuggestions(
  apiKey: string,
  actionPlan: {
    title: string;
    industry?: string | null;
    primaryChannel?: string | null;
    interactionVolume?: string | null;
    currentAutomation?: string | null;
    biggestChallenge?: string | null;
    repetitiveProcesses?: string | null;
    aiGoals: string[];
    autonomyLevel?: string | null;
    currentPlatforms?: string | null;
    teamComfort?: string | null;
    apisAvailable?: string | null;
    successMetrics: string[];
  }
): Promise<{
  success: boolean;
  suggestions?: string;
  error?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Clean up and prepare the action plan data for the prompt
    const cleanPlan = {
      title: actionPlan.title,
      industry: actionPlan.industry || "Not specified",
      primaryChannel: actionPlan.primaryChannel || "Not specified",
      interactionVolume: actionPlan.interactionVolume || "Not specified",
      currentAutomation: actionPlan.currentAutomation || "Not specified",
      biggestChallenge: actionPlan.biggestChallenge || "Not specified",
      repetitiveProcesses: actionPlan.repetitiveProcesses || "Not specified",
      aiGoals: actionPlan.aiGoals.length > 0 ? actionPlan.aiGoals.join(", ") : "Not specified",
      autonomyLevel: actionPlan.autonomyLevel || "Not specified",
      currentPlatforms: actionPlan.currentPlatforms || "Not specified",
      teamComfort: actionPlan.teamComfort || "Not specified",
      apisAvailable: actionPlan.apisAvailable || "Not specified",
      successMetrics: actionPlan.successMetrics.length > 0 ? actionPlan.successMetrics.join(", ") : "Not specified"
    };
    
    // Create a prompt that includes all the necessary context
    const prompt = `You are an expert consultant on implementing AI solutions for businesses. 
You've been asked to review an AI Action Plan for a business and provide strategic suggestions 
for improvement.

Here is the current Action Plan:

PLAN TITLE: ${cleanPlan.title}

BUSINESS DISCOVERY:
- Industry: ${cleanPlan.industry}
- Primary Channel for Customer Interaction: ${cleanPlan.primaryChannel}
- Monthly Interaction Volume: ${cleanPlan.interactionVolume}
- Current Automation: ${cleanPlan.currentAutomation}

PAIN POINT ASSESSMENT:
- Biggest Challenge: ${cleanPlan.biggestChallenge}
- Repetitive Processes: ${cleanPlan.repetitiveProcesses}

AI AGENT GOALS:
- Goals: ${cleanPlan.aiGoals}
- Desired Autonomy Level: ${cleanPlan.autonomyLevel}

SYSTEM & INTEGRATION READINESS:
- Current Platforms: ${cleanPlan.currentPlatforms}
- Team Comfort with No-Code/Low-Code Tools: ${cleanPlan.teamComfort}
- APIs Available: ${cleanPlan.apisAvailable}

SUCCESS METRICS:
- Key Success Metrics: ${cleanPlan.successMetrics}

Based on this information, provide thoughtful suggestions to improve this action plan and increase its chances of success. 
Your response should include:

1. Strategic recommendations (2-3 specific, actionable suggestions)
2. Implementation considerations based on their tech stack and team comfort
3. Risk mitigation strategies
4. Any additional data points they should collect before proceeding
5. Suggestions for phased implementation to ensure early wins

Provide your recommendations in a well-organized, professional format with clear headings. Keep your suggestions specific, 
practical, and tailored to this business's unique needs based on their inputs.`;

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert consultant specializing in AI implementation strategies for businesses." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

    const suggestions = response.choices[0].message.content?.trim();
    
    if (!suggestions) {
      throw new Error('No suggestions were generated');
    }
    
    return {
      success: true,
      suggestions
    };
  } catch (error: any) {
    console.error('Error generating action plan suggestions:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate action plan suggestions'
    };
  }
}
// Generate journey flow from use case
export async function generateJourneyFromUseCase(
  apiKey: string,
  useCase: {
    id: number;
    title: string;
    description?: string | null;
    customer?: string | null;
    problemStatement?: string | null;
    proposedSolution?: string | null;
    keyObjectives?: string | null;
    requiredDataInputs?: string | null;
    expectedOutputs?: string | null;
    keyStakeholders?: string | null;
    scope?: string | null;
    potentialRisks?: string | null;
    estimatedImpact?: string | null;
  }
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
    
    // Prepare a comprehensive description from use case fields
    const descriptionParts = [
      `Title: ${useCase.title}`,
      useCase.customer ? `Customer: ${useCase.customer}` : null,
      useCase.description ? `Description: ${useCase.description}` : null,
      useCase.problemStatement ? `Problem Statement: ${useCase.problemStatement}` : null,
      useCase.proposedSolution ? `Proposed Solution: ${useCase.proposedSolution}` : null,
      useCase.keyObjectives ? `Key Objectives: ${useCase.keyObjectives}` : null,
      useCase.expectedOutputs ? `Expected Outputs: ${useCase.expectedOutputs}` : null,
      useCase.scope ? `Scope: ${useCase.scope}` : null
    ].filter(Boolean).join('\n\n');
    
    // Prepare the prompt
    const prompt = `You are an expert in designing customer journey maps. Create a detailed customer journey based on the following use case:

${descriptionParts}

Generate a complete customer journey map with appropriate stages that best fit this use case.
Each step should have a type, title, and brief description that relates directly to the use case.

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
    console.error('Error generating journey from use case:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate journey from use case'
    };
  }
}

// Generate an example agent journey with OpenAI
export async function generateAgentJourneySuggestion(agentType?: string): Promise<{
  title: string;
  agentName: string;
  purpose: string;
  notes: string;
  summary: string;
  inputInterpretation: string;
  guardrails: string;
  backendSystems: string[];
  contextManagement: string;
  escalationRules: string;
  errorMonitoring: string;
  nodesSuggestion: { type: string; label: string; content: string; position: { x: number; y: number } }[];
}> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({ apiKey });
    
    // Create a prompt based on the agent type or make a general request
    const agentContext = agentType 
      ? `Create an example agent journey for a ${agentType} AI agent.` 
      : 'Create an example agent journey for an AI assistant that helps users.';
    
    const prompt = `
${agentContext}

Please provide a comprehensive example of an agent journey with all these details:
1. A concise title for the journey
2. A name for the agent
3. The purpose of this agent journey (2-3 sentences)
4. Brief notes about implementation (1-2 sentences)
5. A high-level summary of the journey flow (2-3 sentences)
6. How the agent interprets user input (2-3 sentences)
7. Guardrails and safety measures for the agent (2-3 sentences)
8. A list of 3-5 backend systems the agent might integrate with (just names)
9. How the agent manages context during conversations (2-3 sentences)
10. Rules for when to escalate to human agents (2-3 sentences)
11. How errors are monitored and handled (2-3 sentences)
12. A suggestion of 4-6 nodes that would make up this journey, including:
   - Type of each node (start, agent, system, guardrail, decision, escalation, end)
   - Label for each node
   - Brief description of what happens in that node
   - A suggested x,y position for the node in a flow diagram

Format your response as a JSON object with these keys:
title, agentName, purpose, notes, summary, inputInterpretation, guardrails, backendSystems (array), contextManagement, escalationRules, errorMonitoring, nodesSuggestion (an array of objects with type, label, content, and position properties).

Make the example realistic and practical, with specific details that would be useful in a production AI agent.
`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI expert that helps design agent journeys and workflows." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the generated content
    const responseText = response.choices[0].message.content || '';
    const journeySuggestion = JSON.parse(responseText);

    // Return the suggestion
    return journeySuggestion;
  } catch (error: any) {
    console.error('Error generating agent journey suggestion:', error);
    throw new Error(`Failed to generate agent journey suggestion: ${error.message}`);
  }
}
