import { db } from "./db";
import { issues, profiles, upvotes, users, municipalCorps, issueLogs, pointLogs } from "@shared/schema";
import type { InsertIssue, IssueResponse, Profile, InsertProfile, IssueLog, LeaderboardEntry, MunicipalCorp } from "@shared/schema";
import { eq, desc, and, sql, lt, gte } from "drizzle-orm";

export interface IStorage {
  getIssues(userId?: string): Promise<IssueResponse[]>;
  getIssue(id: number, userId?: string): Promise<IssueResponse | undefined>;
  createIssue(issue: InsertIssue, authorId: string): Promise<typeof issues.$inferSelect>;
  toggleUpvote(issueId: number, userId: string): Promise<{ upvotesCount: number, hasUpvoted: boolean }>;

  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(userId: string, profile: Omit<InsertProfile, 'userId'>): Promise<Profile>;

  // Admin
  getAllIssues(filters?: { status?: string; municipalId?: number; category?: string }): Promise<IssueResponse[]>;
  getAdminStats(): Promise<{ total: number; resolved: number; inProgress: number; overdue: number }>;
  getMunicipalCorps(): Promise<MunicipalCorp[]>;
  getMunicipalCorp(id: number): Promise<MunicipalCorp | undefined>;
  getMunicipalStats(municipalId: number): Promise<{ total: number; resolved: number; pending: number; overdue: number; avgResolutionDays: number }>;
  escalateIssue(issueId: number, note: string): Promise<void>;
  addAdminNote(issueId: number, note: string, adminName: string): Promise<void>;

  // Municipal
  claimIssue(issueId: number, municipalId: number, municipalName: string): Promise<void>;
  updateIssueStatus(issueId: number, status: string, note: string, municipalName: string): Promise<void>;
  getMunicipalIssues(municipalId: number): Promise<IssueResponse[]>;
  getUnclaimedIssues(): Promise<IssueResponse[]>;
  getIssueLogs(issueId: number): Promise<IssueLog[]>;

  // Leaderboard & Points
  getLeaderboard(period: 'week' | 'month' | 'all'): Promise<LeaderboardEntry[]>;
  getUserPoints(userId: string): Promise<{ total: number; badge: string; rank: number; breakdown: { fromReports: number; fromResolutions: number }; recentLogs: typeof pointLogs.$inferSelect[] }>;
  awardPoints(userId: string, pointsChange: number, reason: string, issueId?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {

  private async buildIssueResponse(issue: typeof issues.$inferSelect, userId?: string): Promise<IssueResponse> {
    const [author] = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, issue.authorId));
    let authorName = "Unknown";
    if (author) {
      authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || "Unknown User";
    }

    // Author badge
    const [authorProfile] = await db.select({ badge: profiles.badge }).from(profiles).where(eq(profiles.userId, issue.authorId));
    const authorBadge = authorProfile?.badge || "citizen";

    const upvoteCount = await db.select({ count: sql<number>`count(*)` }).from(upvotes).where(eq(upvotes.issueId, issue.id));
    const upvotesCount = Number(upvoteCount[0]?.count || 0);

    let hasUpvoted = false;
    if (userId) {
      const userUpvote = await db.select().from(upvotes).where(and(eq(upvotes.issueId, issue.id), eq(upvotes.userId, userId)));
      hasUpvoted = userUpvote.length > 0;
    }

    let municipalName: string | null = null;
    if (issue.assignedMunicipalId) {
      const [corp] = await db.select({ name: municipalCorps.name }).from(municipalCorps).where(eq(municipalCorps.id, issue.assignedMunicipalId));
      municipalName = corp?.name || null;
    }

    const daysOpen = Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return { ...issue, authorName, authorBadge, upvotesCount, hasUpvoted, municipalName, daysOpen };
  }

  async getIssues(userId?: string): Promise<IssueResponse[]> {
    const allIssues = await db.select().from(issues).orderBy(desc(issues.createdAt));
    const issuesList = await Promise.all(allIssues.map(i => this.buildIssueResponse(i, userId)));
    issuesList.sort((a, b) => b.upvotesCount - a.upvotesCount);
    return issuesList;
  }

  async getIssue(id: number, userId?: string): Promise<IssueResponse | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    if (!issue) return undefined;
    const response = await this.buildIssueResponse(issue, userId);
    const logs = await this.getIssueLogs(id);
    return { ...response, logs };
  }

  async createIssue(issueData: InsertIssue, authorId: string): Promise<typeof issues.$inferSelect> {
    const [issue] = await db.insert(issues).values({ ...issueData, authorId }).returning();
    // Award points for reporting
    await this.awardPoints(authorId, 10, "Reported a new issue", issue.id);
    // Log initial status
    await db.insert(issueLogs).values({ issueId: issue.id, status: "pending", note: "Issue submitted by citizen", changedBy: "System", changedByType: "system" });
    return issue;
  }

  async toggleUpvote(issueId: number, userId: string): Promise<{ upvotesCount: number, hasUpvoted: boolean }> {
    const [existing] = await db.select().from(upvotes).where(and(eq(upvotes.issueId, issueId), eq(upvotes.userId, userId)));
    if (existing) {
      await db.delete(upvotes).where(and(eq(upvotes.issueId, issueId), eq(upvotes.userId, userId)));
    } else {
      await db.insert(upvotes).values({ issueId, userId });
    }
    const upvoteCount = await db.select({ count: sql<number>`count(*)` }).from(upvotes).where(eq(upvotes.issueId, issueId));
    return { upvotesCount: Number(upvoteCount[0]?.count || 0), hasUpvoted: !existing };
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(userId: string, profileData: Omit<InsertProfile, 'userId'>): Promise<Profile> {
    const [profile] = await db.insert(profiles).values({ userId, ...profileData }).onConflictDoUpdate({ target: profiles.userId, set: profileData }).returning();
    return profile;
  }

  // ─── Admin Methods ───────────────────────────────────────────────────────────

  async getAllIssues(filters?: { status?: string; municipalId?: number; category?: string }): Promise<IssueResponse[]> {
    let query = db.select().from(issues).$dynamic();
    const conditions: any[] = [];
    if (filters?.status) conditions.push(eq(issues.status, filters.status));
    if (filters?.municipalId) conditions.push(eq(issues.assignedMunicipalId, filters.municipalId));
    if (filters?.category) conditions.push(eq(issues.maintenanceType, filters.category));
    if (conditions.length > 0) query = query.where(and(...conditions));
    const allIssues = await query.orderBy(desc(issues.createdAt));
    return Promise.all(allIssues.map(i => this.buildIssueResponse(i)));
  }

  async getAdminStats(): Promise<{ total: number; resolved: number; inProgress: number; overdue: number }> {
    const allIssues = await db.select().from(issues);
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return {
      total: allIssues.length,
      resolved: allIssues.filter(i => i.status === "resolved" && i.resolvedAt && new Date(i.resolvedAt) >= thisMonthStart).length,
      inProgress: allIssues.filter(i => i.status === "in_progress").length,
      overdue: allIssues.filter(i => i.status !== "resolved" && new Date(i.createdAt) < sevenDaysAgo).length,
    };
  }

  async getMunicipalCorps(): Promise<MunicipalCorp[]> {
    return db.select().from(municipalCorps).orderBy(municipalCorps.name);
  }

  async getMunicipalCorp(id: number): Promise<MunicipalCorp | undefined> {
    const [corp] = await db.select().from(municipalCorps).where(eq(municipalCorps.id, id));
    return corp;
  }

  async getMunicipalStats(municipalId: number): Promise<{ total: number; resolved: number; pending: number; overdue: number; avgResolutionDays: number }> {
    const corpIssues = await db.select().from(issues).where(eq(issues.assignedMunicipalId, municipalId));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const resolved = corpIssues.filter(i => i.status === "resolved");
    const avgResolutionDays = resolved.length > 0
      ? resolved.reduce((sum, i) => {
          if (!i.resolvedAt) return sum;
          return sum + Math.floor((new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / resolved.length
      : 0;
    return {
      total: corpIssues.length,
      resolved: resolved.length,
      pending: corpIssues.filter(i => i.status === "pending" || i.status === "claimed" || i.status === "in_progress").length,
      overdue: corpIssues.filter(i => i.status !== "resolved" && new Date(i.createdAt) < sevenDaysAgo).length,
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    };
  }

  async escalateIssue(issueId: number, note: string): Promise<void> {
    await db.update(issues).set({ isEscalated: true }).where(eq(issues.id, issueId));
    await db.insert(issueLogs).values({ issueId, status: "escalated", note, changedBy: "District Magistrate", changedByType: "admin" });
  }

  async addAdminNote(issueId: number, note: string, adminName: string): Promise<void> {
    await db.insert(issueLogs).values({ issueId, status: "note", note, changedBy: adminName, changedByType: "admin" });
  }

  // ─── Municipal Methods ────────────────────────────────────────────────────────

  async claimIssue(issueId: number, municipalId: number, municipalName: string): Promise<void> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
    if (!issue) throw new Error("Issue not found");
    if (issue.assignedMunicipalId) throw new Error("Issue already claimed");
    await db.update(issues).set({ status: "claimed", assignedMunicipalId: municipalId, claimedAt: new Date() }).where(eq(issues.id, issueId));
    await db.insert(issueLogs).values({ issueId, status: "claimed", note: `Claimed by ${municipalName}`, changedBy: municipalName, changedByType: "municipal" });
    // Award reporter +5 for valid report
    await this.awardPoints(issue.authorId, 5, "Your issue was claimed by a municipal corporation", issueId);
  }

  async updateIssueStatus(issueId: number, status: string, note: string, municipalName: string): Promise<void> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
    if (!issue) throw new Error("Issue not found");
    
    const updateData: any = { status };
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
      updateData.resolutionNote = note;
    }
    await db.update(issues).set(updateData).where(eq(issues.id, issueId));
    await db.insert(issueLogs).values({ issueId, status, note, changedBy: municipalName, changedByType: "municipal" });

    if (status === "resolved" && issue.authorId) {
      await this.awardPoints(issue.authorId, 20, "Your reported issue has been resolved!", issueId);
      // Bonus if resolved within 3 days
      const daysToResolve = Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysToResolve <= 3) {
        await this.awardPoints(issue.authorId, 10, "Bonus: Issue resolved within 3 days!", issueId);
      }
    }
  }

  async getMunicipalIssues(municipalId: number): Promise<IssueResponse[]> {
    const corpIssues = await db.select().from(issues).where(eq(issues.assignedMunicipalId, municipalId)).orderBy(desc(issues.createdAt));
    return Promise.all(corpIssues.map(i => this.buildIssueResponse(i)));
  }

  async getUnclaimedIssues(): Promise<IssueResponse[]> {
    const unclaimed = await db.select().from(issues).where(eq(issues.status, "pending")).orderBy(desc(issues.createdAt));
    return Promise.all(unclaimed.map(i => this.buildIssueResponse(i)));
  }

  async getIssueLogs(issueId: number): Promise<IssueLog[]> {
    return db.select().from(issueLogs).where(eq(issueLogs.issueId, issueId)).orderBy(issueLogs.createdAt);
  }

  // ─── Leaderboard & Points ─────────────────────────────────────────────────────

  async getLeaderboard(period: 'week' | 'month' | 'all'): Promise<LeaderboardEntry[]> {
    let dateFilter: Date | undefined;
    if (period === 'week') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (period === 'month') dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all profiles sorted by points
    const allProfiles = await db.select({
      userId: profiles.userId,
      points: profiles.points,
      badge: profiles.badge,
    }).from(profiles).orderBy(desc(profiles.points)).limit(50);

    const result: LeaderboardEntry[] = [];
    for (let i = 0; i < allProfiles.length; i++) {
      const p = allProfiles[i];
      const [user] = await db.select({ firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl }).from(users).where(eq(users.id, p.userId));
      const issuesReported = await db.select({ count: sql<number>`count(*)` }).from(issues).where(eq(issues.authorId, p.userId));
      result.push({
        userId: p.userId,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        profileImageUrl: user?.profileImageUrl || null,
        points: p.points,
        badge: p.badge,
        issuesReported: Number(issuesReported[0]?.count || 0),
        rank: i + 1,
      });
    }
    return result;
  }

  async getUserPoints(userId: string): Promise<{ total: number; badge: string; rank: number; breakdown: { fromReports: number; fromResolutions: number }; recentLogs: typeof pointLogs.$inferSelect[] }> {
    const [profile] = await db.select({ points: profiles.points, badge: profiles.badge }).from(profiles).where(eq(profiles.userId, userId));
    const total = profile?.points || 0;
    const badge = profile?.badge || "citizen";

    // Calculate rank
    const higher = await db.select({ count: sql<number>`count(*)` }).from(profiles).where(sql`${profiles.points} > ${total}`);
    const rank = Number(higher[0]?.count || 0) + 1;

    const allLogs = await db.select().from(pointLogs).where(eq(pointLogs.userId, userId)).orderBy(desc(pointLogs.createdAt));
    const recentLogs = allLogs.slice(0, 10);

    const fromReports = allLogs.filter(l => l.reason.includes("Reported")).reduce((sum, l) => sum + l.pointsChange, 0);
    const fromResolutions = allLogs.filter(l => l.reason.includes("resolved")).reduce((sum, l) => sum + l.pointsChange, 0);

    return { total, badge, rank, breakdown: { fromReports, fromResolutions }, recentLogs };
  }

  async awardPoints(userId: string, pointsChange: number, reason: string, issueId?: number): Promise<void> {
    await db.insert(pointLogs).values({ userId, pointsChange, reason, issueId: issueId || null });
    // Ensure profile exists and update points
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (existing) {
      const newPoints = Math.max(0, existing.points + pointsChange);
      const badge = this.computeBadge(newPoints);
      await db.update(profiles).set({ points: newPoints, badge }).where(eq(profiles.userId, userId));
    } else {
      // Create profile with points
      const newPoints = Math.max(0, pointsChange);
      const badge = this.computeBadge(newPoints);
      await db.insert(profiles).values({ userId, aadhaarNumber: "", points: newPoints, badge }).onConflictDoUpdate({
        target: profiles.userId, set: { points: newPoints, badge }
      });
    }
  }

  private computeBadge(points: number): string {
    if (points >= 1000) return "city_legend";
    if (points >= 500) return "ward_champion";
    if (points >= 150) return "community_hero";
    if (points >= 50) return "active_member";
    return "citizen";
  }
}

export const storage = new DatabaseStorage();
