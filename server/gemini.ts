import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

export const GEMINI_API_KEY_SETTING = 'gemini.apiKey';

export async function validateGeminiKey(apiKey: string): Promise<{ valid: boolean; models?: string[]; error?: string }> {
    try {
        if (!apiKey) {
            return { valid: false, error: 'API key is required' };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Test the API key by making a simple request
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hello, this is a test to validate the API key. Please respond with 'API key is valid'.",
        });

        if (response.text) {
            // List available models (simplified for Gemini)
            const availableModels = [
                'gemini-2.5-flash',
                'gemini-2.5-pro',
                'gemini-2.0-flash-preview-image-generation'
            ];
            
            return { 
                valid: true, 
                models: availableModels
            };
        } else {
            return { valid: false, error: 'No response from Gemini API' };
        }
    } catch (error: any) {
        console.error('Gemini API validation error:', error);
        
        // Parse common Gemini API errors
        if (error.message?.includes('API_KEY_INVALID')) {
            return { valid: false, error: 'Invalid API key' };
        } else if (error.message?.includes('PERMISSION_DENIED')) {
            return { valid: false, error: 'Permission denied - check API key permissions' };
        } else if (error.message?.includes('QUOTA_EXCEEDED')) {
            return { valid: false, error: 'API quota exceeded' };
        } else if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
            return { valid: false, error: 'Rate limit exceeded - try again later' };
        } else {
            return { 
                valid: false, 
                error: error.message || 'Unknown error occurred while validating API key' 
            };
        }
    }
}

export async function summarizeArticle(text: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "Something went wrong";
}

export interface Sentiment {
    rating: number;
    confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        rating: { type: "number" },
                        confidence: { type: "number" },
                    },
                    required: ["rating", "confidence"],
                },
            },
            contents: text,
        });

        const rawJson = response.text;

        console.log(`Raw JSON: ${rawJson}`);

        if (rawJson) {
            const data: Sentiment = JSON.parse(rawJson);
            return data;
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        throw new Error(`Failed to analyze sentiment: ${error}`);
    }
}

export async function generateUseCaseSuggestions(
    agentType?: string
): Promise<{
    title: string;
    agentName: string;
    purpose: string;
    inputInterpretation: string;
    guardrails: string;
    backendSystems: string[];
    contextManagement: string;
    escalationRules: string;
    errorMonitoring: string;
    notes: string;
}> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Generate a comprehensive AI agent journey for a ${agentType || 'customer service'} agent. 
    
Please provide detailed information for each of the following fields:
- title: A descriptive title for this agent journey
- agentName: A specific name for this AI agent
- purpose: The main purpose and goals of this agent
- inputInterpretation: How the agent interprets and processes user inputs
- guardrails: Safety measures and content restrictions
- backendSystems: List of backend systems this agent might integrate with
- contextManagement: How the agent maintains conversation context
- escalationRules: When and how the agent escalates to humans
- errorMonitoring: How errors are detected and handled
- notes: Additional implementation notes

Respond with a JSON object containing all these fields.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    agentName: { type: "string" },
                    purpose: { type: "string" },
                    inputInterpretation: { type: "string" },
                    guardrails: { type: "string" },
                    backendSystems: { 
                        type: "array",
                        items: { type: "string" }
                    },
                    contextManagement: { type: "string" },
                    escalationRules: { type: "string" },
                    errorMonitoring: { type: "string" },
                    notes: { type: "string" }
                },
                required: [
                    "title", "agentName", "purpose", "inputInterpretation", 
                    "guardrails", "backendSystems", "contextManagement", 
                    "escalationRules", "errorMonitoring", "notes"
                ]
            }
        },
        contents: prompt,
    });

    if (!response.text) {
        throw new Error('No response from Gemini API');
    }

    try {
        return JSON.parse(response.text);
    } catch (error) {
        throw new Error('Failed to parse Gemini response as JSON');
    }
}