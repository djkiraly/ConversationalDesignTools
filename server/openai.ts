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