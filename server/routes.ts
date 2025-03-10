import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { 
  insertGoalSchema, 
  insertProgressLogSchema, 
  insertUserSchema,
  goalFormSchema,
  progressLogFormSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    // For this MVP, we'll use a simple userId = 1 as a placeholder
    // In a real application, this would be handled by proper auth middleware
    req.body.userId = 1;
    next();
  };

  // ==== User Routes ====
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // ==== Goal Routes ====
  app.get('/api/goals', requireAuth, async (req, res) => {
    try {
      const userId = req.body.userId;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.get('/api/goals/:id', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goal" });
    }
  });

  app.post('/api/goals', requireAuth, async (req, res) => {
    try {
      const userId = req.body.userId;
      
      // Validate with Zod schema
      const goalData = goalFormSchema.parse(req.body);
      
      // Create the goal
      const newGoal = await storage.createGoal({
        userId,
        description: goalData.description,
        targetValue: goalData.targetValue,
        unit: goalData.unit,
        deadline: goalData.deadline,
        categoryId: goalData.categoryId,
        reminderFrequency: goalData.reminderFrequency
      });
      
      res.status(201).json(newGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.patch('/api/goals/:id', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const updates = req.body;
      
      // Validate goal exists
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Update the goal
      const updatedGoal = await storage.updateGoal(goalId, updates);
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  app.delete('/api/goals/:id', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // Validate goal exists
      const goal = await storage.getGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Delete the goal
      await storage.deleteGoal(goalId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // ==== Progress Routes ====
  app.get('/api/goals/:goalId/progress', requireAuth, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const progressLogs = await storage.getProgressLogs(goalId);
      res.json(progressLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress logs" });
    }
  });

  app.post('/api/progress', requireAuth, async (req, res) => {
    try {
      // Validate with Zod schema
      const progressData = progressLogFormSchema.parse(req.body);
      
      // Create the progress log
      const newLog = await storage.createProgressLog({
        goalId: progressData.goalId,
        value: progressData.value,
        notes: progressData.notes
      });
      
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to log progress" });
    }
  });

  // ==== Category Routes ====
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // ==== Action Items Routes ====
  app.get('/api/action-items', requireAuth, async (req, res) => {
    try {
      const userId = req.body.userId;
      let date = undefined;
      
      // Check for date query param
      if (req.query.date) {
        date = new Date(req.query.date as string);
      } else {
        // Default to today
        date = new Date();
      }
      
      const actionItems = await storage.getActionItems(userId, date);
      res.json(actionItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch action items" });
    }
  });

  app.patch('/api/action-items/:id', requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { completed } = req.body;
      
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ message: "Completed status must be a boolean" });
      }
      
      const updatedItem = await storage.updateActionItem(itemId, completed);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update action item" });
    }
  });

  // ==== Dashboard Routes ====
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const userId = req.body.userId;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ==== Badges Routes ====
  app.get('/api/badges', requireAuth, async (req, res) => {
    try {
      const userId = req.body.userId;
      const badges = await storage.getBadgesByUser(userId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });
  
  // ==== Documentation Routes ====
  app.get('/:filename([A-Za-z0-9_-]+\\.md)', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).send(`Markdown file "${filename}" not found`);
      }
      
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Set content type to text/markdown
      res.setHeader('Content-Type', 'text/markdown');
      res.send(content);
    } catch (error) {
      console.error(`Error serving markdown file:`, error);
      res.status(500).send('Failed to read markdown file');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
