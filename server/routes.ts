import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUseCaseSchema, 
  updateUseCaseSchema, 
  insertSettingSchema, 
  updateSettingSchema,
  insertCustomerJourneySchema,
  updateCustomerJourneySchema
} from "@shared/schema";
import { validateOpenAIKey, getUseCaseSuggestions, getAgentPersonaSuggestion, getConversationFlowSuggestion, generateJourneySummary, OPENAI_API_KEY_SETTING } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use Cases APIs
  app.get('/api/use-cases', async (_req, res) => {
    try {
      const useCases = await storage.getAllUseCases();
      res.json(useCases);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/use-cases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const useCase = await storage.getUseCase(id);
      if (!useCase) {
        return res.status(404).json({ error: "Use case not found" });
      }

      res.json(useCase);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/use-cases', async (req, res) => {
    try {
      const result = insertUseCaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const newUseCase = await storage.createUseCase(result.data);
      res.status(201).json(newUseCase);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/use-cases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const existingUseCase = await storage.getUseCase(id);
      if (!existingUseCase) {
        return res.status(404).json({ error: "Use case not found" });
      }

      const result = updateUseCaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const updatedUseCase = await storage.updateUseCase(id, result.data);
      res.json(updatedUseCase);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/use-cases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const existingUseCase = await storage.getUseCase(id);
      if (!existingUseCase) {
        return res.status(404).json({ error: "Use case not found" });
      }

      await storage.deleteUseCase(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Settings APIs
  app.get('/api/settings', async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/settings/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }

      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const result = insertSettingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const newSetting = await storage.createSetting(result.data);
      res.status(201).json(newSetting);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/settings/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const existingSetting = await storage.getSetting(key);
      
      if (!existingSetting) {
        return res.status(404).json({ error: "Setting not found" });
      }

      const result = updateSettingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const updatedSetting = await storage.updateSetting(key, result.data);
      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/settings/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const existingSetting = await storage.getSetting(key);
      
      if (!existingSetting) {
        return res.status(404).json({ error: "Setting not found" });
      }

      await storage.deleteSetting(key);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // OpenAI Validation API
  app.post('/api/openai/validate', async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }
      
      const validationResult = await validateOpenAIKey(apiKey);
      res.json(validationResult);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // OpenAI Suggestions API
  app.post('/api/openai/suggestions', async (req, res) => {
    try {
      const { title, description, agentPersona } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }
      
      console.log("Received request for AI suggestions with title:", title);
      console.log("Received request for AI suggestions with description:", description);
      console.log("Received request for AI suggestions with agentPersona:", agentPersona || "none");
      
      // Get the OpenAI API key from settings
      const apiKeySetting = await storage.getSetting(OPENAI_API_KEY_SETTING);
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ error: "OpenAI API key not configured. Please add it in Settings." });
      }
      
      // Make sure the API key is not empty
      if (apiKeySetting.value.trim() === '') {
        return res.status(400).json({ error: "OpenAI API key is empty. Please add a valid key in Settings." });
      }
      
      const suggestionsResult = await getUseCaseSuggestions(
        apiKeySetting.value,
        title,
        description,
        agentPersona
      );
      
      res.json(suggestionsResult);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Endpoint for agent persona suggestions
  app.post('/api/openai/agent-persona', async (req, res) => {
    try {
      const { title, description, currentPersona } = req.body;
      
      // Validate input
      if (!title && !description) {
        return res.status(400).json({ error: "Either title or description is required for context" });
      }
      
      console.log("Received request for agent persona suggestion with title:", title || "none");
      console.log("Received request for agent persona suggestion with description:", description || "none");
      console.log("Received request for agent persona suggestion with currentPersona:", currentPersona || "none");
      
      // Get the OpenAI API key from settings
      const apiKeySetting = await storage.getSetting(OPENAI_API_KEY_SETTING);
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ error: "OpenAI API key not configured. Please add it in Settings." });
      }
      
      // Make sure the API key is not empty
      if (apiKeySetting.value.trim() === '') {
        return res.status(400).json({ error: "OpenAI API key is empty. Please add a valid key in Settings." });
      }
      
      // Call OpenAI to get agent persona suggestion
      const response = await getAgentPersonaSuggestion(
        apiKeySetting.value,
        title || "",
        description || "",
        currentPersona
      );
      
      res.json(response);
    } catch (error) {
      console.error('Error getting agent persona suggestion:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message || 'Failed to get agent persona suggestion from OpenAI' 
      });
    }
  });

  // Endpoint for conversation flow suggestions
  app.post('/api/openai/conversation-flow', async (req, res) => {
    try {
      const { title, description, currentFlow, agentPersona, additionalInstructions } = req.body;
      
      // Validate input
      if (!currentFlow) {
        return res.status(400).json({ error: "Current conversation flow is required" });
      }
      
      console.log("Received request for conversation flow suggestion with title:", title || "none");
      console.log("Received request for conversation flow suggestion with description:", description || "none");
      console.log("Received request for conversation flow suggestion with agentPersona:", agentPersona || "none");
      console.log("Received request for conversation flow suggestion with additionalInstructions:", additionalInstructions || "none");
      
      // Get the OpenAI API key from settings
      const apiKeySetting = await storage.getSetting(OPENAI_API_KEY_SETTING);
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ error: "OpenAI API key not configured. Please add it in Settings." });
      }
      
      // Make sure the API key is not empty
      if (apiKeySetting.value.trim() === '') {
        return res.status(400).json({ error: "OpenAI API key is empty. Please add a valid key in Settings." });
      }
      
      // Call OpenAI to get conversation flow suggestion
      const response = await getConversationFlowSuggestion(
        apiKeySetting.value,
        title || "",
        description || "",
        currentFlow,
        agentPersona || "",
        additionalInstructions || ""
      );
      
      res.json(response);
    } catch (error) {
      console.error('Error getting conversation flow suggestion:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message || 'Failed to get conversation flow suggestion from OpenAI' 
      });
    }
  });

  // Customer Journey APIs
  app.get('/api/customer-journeys', async (_req, res) => {
    try {
      const journeys = await storage.getAllCustomerJourneys();
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/customer-journeys/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const journey = await storage.getCustomerJourney(id);
      if (!journey) {
        return res.status(404).json({ error: "Customer journey not found" });
      }

      res.json(journey);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/customer-journeys', async (req, res) => {
    try {
      const result = insertCustomerJourneySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const newJourney = await storage.createCustomerJourney(result.data);
      res.status(201).json(newJourney);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/customer-journeys/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const existingJourney = await storage.getCustomerJourney(id);
      if (!existingJourney) {
        return res.status(404).json({ error: "Customer journey not found" });
      }

      const result = updateCustomerJourneySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.message });
      }

      const updatedJourney = await storage.updateCustomerJourney(id, result.data);
      res.json(updatedJourney);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/customer-journeys/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const existingJourney = await storage.getCustomerJourney(id);
      if (!existingJourney) {
        return res.status(404).json({ error: "Customer journey not found" });
      }

      await storage.deleteCustomerJourney(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Endpoint for generating journey summaries
  app.post('/api/customer-journeys/:id/generate-summary', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const journey = await storage.getCustomerJourney(id);
      if (!journey) {
        return res.status(404).json({ error: "Customer journey not found" });
      }
      
      // Get the OpenAI API key from settings
      const apiKeySetting = await storage.getSetting(OPENAI_API_KEY_SETTING);
      if (!apiKeySetting || !apiKeySetting.value) {
        return res.status(400).json({ error: "OpenAI API key not configured. Please add it in Settings." });
      }
      
      // Make sure the API key is not empty
      if (apiKeySetting.value.trim() === '') {
        return res.status(400).json({ error: "OpenAI API key is empty. Please add a valid key in Settings." });
      }
      
      // Generate summary using OpenAI
      const result = await generateJourneySummary(
        apiKeySetting.value,
        {
          title: journey.title,
          customerName: journey.customerName || undefined,
          workflowIntent: journey.workflowIntent || undefined,
          notes: journey.notes || undefined,
          nodes: journey.nodes as any[]
        }
      );
      
      if (!result.success || !result.summary) {
        return res.status(500).json({ 
          error: result.error || "Failed to generate summary" 
        });
      }
      
      // Update the journey with the generated summary
      const updatedJourney = await storage.updateCustomerJourney(id, {
        title: journey.title,
        customerName: journey.customerName,
        workflowIntent: journey.workflowIntent,
        notes: journey.notes,
        summary: result.summary,
        nodes: journey.nodes as any,
        edges: journey.edges as any
      });
      
      res.json({
        success: true,
        journey: updatedJourney
      });
    } catch (error) {
      console.error('Error generating journey summary:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message || 'Failed to generate journey summary' 
      });
    }
  });

  // Health check endpoint for monitoring
  app.get('/api/health', async (_req, res) => {
    try {
      // Check database connection by performing a simple query
      await storage.getAllSettings();
      
      // Return health status and system info
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({ 
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
