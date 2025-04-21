import OpenAI from "openai";
import { TranscriptAnalysisResult, JourneyData } from "@shared/schema";

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

/**
 * Analyzes a conversation transcript and generates a structured analysis
 * @param apiKey OpenAI API key
 * @param transcriptTitle Title of the transcript
 * @param transcriptContent Full text content of the transcript
 * @returns Analysis result including intents, sentiment, journey map, and insights
 */
export async function analyzeTranscript(
  apiKey: string,
  transcriptTitle: string,
  transcriptContent: string
): Promise<{
  success: boolean;
  analysis?: TranscriptAnalysisResult;
  error?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare the prompt
    const prompt = `You are an expert in analyzing customer conversations and building customer journey maps. 
I want you to analyze the following conversation transcript in detail and extract key insights.

Transcript Title: "${transcriptTitle}"

Transcript Content:
\`\`\`
${transcriptContent}
\`\`\`

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "intents": [
    {
      "name": "string", // e.g., "Request refund", "Track order", "Technical issue"
      "frequency": number, // how many times this intent appears
      "examples": ["string"] // 1-3 example quotes from the transcript
    }
  ],
  "sentiments": {
    "positive": number, // percentage (0-1)
    "negative": number, // percentage (0-1)
    "neutral": number // percentage (0-1)
  },
  "journeyMap": {
    "nodes": [
      {
        "id": "string", // unique identifier
        "type": "string", // "input", "output", "default"
        "label": "string", // short descriptive label
        "data": {
          "nodeType": "string", // "entry", "process", "decision", "exit"
          "description": "string", // detailed description
          "metrics": {
            "frequency": number, // percentage (0-100)
            "duration": number, // seconds if applicable
            "satisfaction": number, // score (0-1) if applicable
            "dropoff": number // percentage (0-100) if applicable
          }
        },
        "position": { "x": number, "y": number } // suggested visual coordinates
      }
    ],
    "edges": [
      {
        "id": "string", // unique identifier
        "source": "string", // node id
        "target": "string", // node id
        "type": "string", // "default", "success", "warning", "error"
        "label": "string", // optional label
        "data": {
          "frequency": number, // percentage (0-100)
          "condition": "string" // description of when this path is taken
        }
      }
    ]
  },
  "insights": {
    "bottlenecks": [
      {
        "nodeId": "string", // reference to a node
        "reason": "string", // why this is a bottleneck
        "suggestion": "string" // how to improve
      }
    ],
    "dropoffs": [
      {
        "nodeId": "string", // reference to a node
        "frequency": number, // percentage (0-100)
        "reason": "string" // why customers drop off here
      }
    ],
    "improvements": [
      {
        "type": "string", // "efficiency", "satisfaction", "clarity"
        "description": "string", // what could be improved
        "impact": "string" // estimated impact of this change
      }
    ]
  }
}

Create a detailed and accurate analysis that identifies the key conversation flow steps,
decision points, and potential areas for improvement. Ensure the journey map accurately
represents the flow of the conversation, including all major paths and decision points.`;

    // Make a request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI expert in conversation analysis and customer journey mapping." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 4000
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No analysis was generated');
    }
    
    const analysis = JSON.parse(content) as TranscriptAnalysisResult;
    
    return { 
      success: true,
      analysis
    };
  } catch (error: any) {
    console.error('Error analyzing transcript:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to analyze transcript'
    };
  }
}

/**
 * Generate an optimized journey map based on a partial or existing journey map
 * @param apiKey OpenAI API key
 * @param title Title of the journey map
 * @param description Description of the journey map
 * @param currentJourneyMap Current journey map data (if available)
 * @returns Enhanced journey map data
 */
export async function optimizeJourneyMap(
  apiKey: string,
  title: string,
  description: string,
  currentJourneyMap?: JourneyData
): Promise<{
  success: boolean;
  journeyMap?: JourneyData;
  error?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare the prompt
    let prompt = `You are an expert in customer journey mapping and conversation flow optimization.
I need you to ${currentJourneyMap ? 'enhance the existing' : 'create a new'} customer journey map for the following scenario:

Title: "${title}"
Description: "${description}"
`;

    if (currentJourneyMap) {
      prompt += `\nCurrent Journey Map:
\`\`\`json
${JSON.stringify(currentJourneyMap, null, 2)}
\`\`\`

Analyze this journey map and suggest improvements to make it more comprehensive, logical, and effective.
Maintain the existing structure while enhancing the flow, adding any missing nodes or connections,
and optimizing the overall customer journey.`;
    } else {
      prompt += `\nCreate a comprehensive customer journey map that:
1. Identifies all key touchpoints in the customer journey
2. Includes decision points and alternative paths
3. Highlights potential bottlenecks or friction points
4. Provides metrics for each node (frequency, duration, satisfaction)
5. Suggests optimizations for improving the journey`;
    }

    prompt += `\n
Respond with a JSON object that follows this structure:
{
  "nodes": [
    {
      "id": "string", // unique identifier
      "type": "string", // "input", "output", "default"
      "label": "string", // short descriptive label
      "data": {
        "nodeType": "string", // "entry", "process", "decision", "exit"
        "description": "string", // detailed description
        "metrics": {
          "frequency": number, // percentage (0-100)
          "duration": number, // seconds if applicable
          "satisfaction": number, // score (0-1) if applicable
          "dropoff": number // percentage (0-100) if applicable
        },
        "tags": ["string"], // optional categories or tags
        "examples": ["string"] // optional examples of this step
      },
      "position": { "x": number, "y": number } // suggested visual coordinates
    }
  ],
  "edges": [
    {
      "id": "string", // unique identifier
      "source": "string", // node id
      "target": "string", // node id
      "type": "string", // "default", "success", "warning", "error"
      "label": "string", // optional label
      "data": {
        "frequency": number, // percentage (0-100)
        "condition": "string" // description of when this path is taken
      }
    }
  ]
}

Create a logical, well-structured journey map with proper node placement and connections.
${currentJourneyMap ? 'Build upon the existing structure while improving it.' : 'Design a complete end-to-end customer journey.'}`

    // Make a request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI expert in customer journey mapping and experience optimization." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 4000
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No journey map was generated');
    }
    
    const journeyMap = JSON.parse(content) as JourneyData;
    
    return { 
      success: true,
      journeyMap
    };
  } catch (error: any) {
    console.error('Error optimizing journey map:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to optimize journey map'
    };
  }
}