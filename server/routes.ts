import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication before anything else
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.issues.list.path, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const issues = await storage.getIssues(userId);
      res.json(issues);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get(api.issues.get.path, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const issue = await storage.getIssue(Number(req.params.id), userId);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });

  app.post(api.issues.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.issues.create.input.parse(req.body);
      const issue = await storage.createIssue(input, userId);
      res.status(201).json(issue);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Failed to create issue" });
    }
  });

  app.post(api.issues.toggleUpvote.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const issueId = Number(req.params.id);
      
      const issue = await storage.getIssue(issueId);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const result = await storage.toggleUpvote(issueId, userId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to toggle upvote" });
    }
  });

  app.get(api.profile.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post(api.profile.upsert.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.profile.upsert.input.parse(req.body);
      const profile = await storage.upsertProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  return httpServer;
}
