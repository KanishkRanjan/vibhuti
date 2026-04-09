import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  adminLogin, adminLogout, getAdminMe, isAdmin,
  municipalLogin, municipalLogout, getMunicipalMe, isMunicipal,
  seedDefaultAccounts
} from "./adminAuth";
import { db } from "./db";
import { municipalCorps } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  await seedDefaultAccounts();

  // ─── Citizen Issue Routes ─────────────────────────────────────────────────────
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
      if (!issue) return res.status(404).json({ message: "Issue not found" });
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
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
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
      if (!issue) return res.status(404).json({ message: "Issue not found" });
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
      if (!profile) return res.status(404).json({ message: "Profile not found" });
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
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error(err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ─── Leaderboard ──────────────────────────────────────────────────────────────
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const period = (req.query.period as string) || "all";
      const entries = await storage.getLeaderboard(period as 'week' | 'month' | 'all');
      res.json(entries);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.get("/api/user/points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = await storage.getUserPoints(userId);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch points" });
    }
  });

  // ─── Admin Auth ───────────────────────────────────────────────────────────────
  app.post("/api/admin/login", adminLogin);
  app.post("/api/admin/logout", adminLogout);
  app.get("/api/admin/me", getAdminMe);

  // ─── Admin Dashboard API ──────────────────────────────────────────────────────
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/issues", isAdmin, async (req, res) => {
    try {
      const { status, municipalId, category } = req.query;
      const issues = await storage.getAllIssues({
        status: status as string,
        municipalId: municipalId ? Number(municipalId) : undefined,
        category: category as string,
      });
      res.json(issues);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get("/api/admin/municipals", isAdmin, async (req, res) => {
    try {
      const corps = await storage.getMunicipalCorps();
      res.json(corps);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch municipal corps" });
    }
  });

  app.get("/api/admin/municipals/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const corp = await storage.getMunicipalCorp(id);
      if (!corp) return res.status(404).json({ message: "Not found" });
      const stats = await storage.getMunicipalStats(id);
      const issues = await storage.getMunicipalIssues(id);
      res.json({ corp, stats, issues });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch municipal details" });
    }
  });

  app.post("/api/admin/issues/:id/escalate", isAdmin, async (req: any, res) => {
    try {
      const { note } = req.body;
      await storage.escalateIssue(Number(req.params.id), note || "Escalated by DM");
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to escalate issue" });
    }
  });

  app.post("/api/admin/issues/:id/note", isAdmin, async (req: any, res) => {
    try {
      const { note } = req.body;
      await storage.addAdminNote(Number(req.params.id), note, "District Magistrate");
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to add note" });
    }
  });

  // ─── Municipal Auth ───────────────────────────────────────────────────────────
  app.post("/api/municipal/login", municipalLogin);
  app.post("/api/municipal/logout", municipalLogout);
  app.get("/api/municipal/me", getMunicipalMe);

  // ─── Municipal Dashboard API ──────────────────────────────────────────────────
  app.get("/api/municipal/unclaimed", isMunicipal, async (req, res) => {
    try {
      const issues = await storage.getUnclaimedIssues();
      res.json(issues);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch unclaimed issues" });
    }
  });

  app.get("/api/municipal/issues", isMunicipal, async (req: any, res) => {
    try {
      const municipalId = (req.session as any).municipalId;
      const issues = await storage.getMunicipalIssues(municipalId);
      res.json(issues);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch municipal issues" });
    }
  });

  app.post("/api/municipal/issues/:id/claim", isMunicipal, async (req: any, res) => {
    try {
      const municipalId = (req.session as any).municipalId;
      const [corp] = await db.select().from(municipalCorps).where(eq(municipalCorps.id, municipalId));
      await storage.claimIssue(Number(req.params.id), municipalId, corp?.name || "Municipal Corp");
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message || "Failed to claim issue" });
    }
  });

  app.post("/api/municipal/issues/:id/status", isMunicipal, async (req: any, res) => {
    try {
      const municipalId = (req.session as any).municipalId;
      const [corp] = await db.select().from(municipalCorps).where(eq(municipalCorps.id, municipalId));
      const { status, note } = req.body;
      if (!["in_progress", "resolved"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      await storage.updateIssueStatus(Number(req.params.id), status, note || "", corp?.name || "Municipal Corp");
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  app.get("/api/municipal/issues/:id/logs", isMunicipal, async (req, res) => {
    try {
      const logs = await storage.getIssueLogs(Number(req.params.id));
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  return httpServer;
}
