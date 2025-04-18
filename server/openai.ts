import OpenAI from "openai";

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