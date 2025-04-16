import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUseCaseSchema, updateUseCaseSchema } from "@shared/schema";

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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
