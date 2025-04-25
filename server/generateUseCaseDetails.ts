import OpenAI from "openai";

// Generate detailed use case field suggestions
export async function generateUseCaseDetails(
  apiKey: string,
  title: string,
  description: string,
  customer?: string
): Promise<{
  success: boolean;
  suggestions?: {
    problemStatement: string;
    proposedSolution: string;
    keyObjectives: string;
    requiredDataInputs: string;
    expectedOutputs: string;
    keyStakeholders: string;
    scope: string;
    potentialRisks: string;
    estimatedImpact: string;
  };
  error?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey });
    
    // Prepare the prompt
    const prompt = `You are an AI use case definition expert. Based on the following basic information, 
generate detailed fields for a comprehensive AI use case definition.

Title: "${title}"
Description: "${description}"
${customer ? `Customer: "${customer}"` : ''}

For each of the following fields, provide concise but comprehensive information:
1. Problem Statement: A clear articulation of the problem being solved
2. Proposed AI Solution: How AI can address this problem
3. Key Objectives & Success Metrics: Quantifiable goals and how success will be measured
4. Required Data Inputs: Data sources, types, and availability status needed
5. Expected Outputs & Actions: What outputs and actions the AI will produce
6. Key Stakeholders: Business and technical stakeholders involved
7. High-Level Scope: Define inclusions and exclusions for this use case
8. Potential Risks & Dependencies: Identify risks and dependencies
9. Estimated Impact/Value: Quantify the expected impact or value

Respond ONLY with a JSON object containing these fields:
{
  "problemStatement": "...",
  "proposedSolution": "...",
  "keyObjectives": "...",
  "requiredDataInputs": "...",
  "expectedOutputs": "...",
  "keyStakeholders": "...",
  "scope": "...",
  "potentialRisks": "...",
  "estimatedImpact": "..."
}

Each field should contain 2-4 detailed sentences of specific information without being overly verbose.`;

    // Make a request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI expert in defining comprehensive use cases." },
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
    console.error("Error generating use case details:", error);
    return {
      success: false,
      error: error.message || "Failed to generate use case details"
    };
  }
}