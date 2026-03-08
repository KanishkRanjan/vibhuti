import { db } from "./db";
import { issues, profiles, upvotes, users } from "@shared/schema";
import type { InsertIssue, IssueResponse, Profile, InsertProfile } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getIssues(userId?: string): Promise<IssueResponse[]>;
  getIssue(id: number, userId?: string): Promise<IssueResponse | undefined>;
  createIssue(issue: InsertIssue, authorId: string): Promise<typeof issues.$inferSelect>;
  toggleUpvote(issueId: number, userId: string): Promise<{ upvotesCount: number, hasUpvoted: boolean }>;
  
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(userId: string, profile: Omit<InsertProfile, 'userId'>): Promise<Profile>;
}

export class DatabaseStorage implements IStorage {
  
  async getIssues(userId?: string): Promise<IssueResponse[]> {
    const allIssues = await db.select().from(issues).orderBy(desc(issues.createdAt));

    const issuesList: IssueResponse[] = [];
    
    for (const issue of allIssues) {
      // Get author name
      const [author] = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, issue.authorId));
      let authorName = "Unknown";
      if (author) {
        authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || "Unknown User";
      }

      // Get upvotes count
      const upvoteCount = await db.select({ count: sql<number>`count(*)` }).from(upvotes).where(eq(upvotes.issueId, issue.id));
      const upvotesCount = Number(upvoteCount[0]?.count || 0);

      // Check if current user has upvoted
      let hasUpvoted = false;
      if (userId) {
        const userUpvote = await db.select().from(upvotes).where(and(eq(upvotes.issueId, issue.id), eq(upvotes.userId, userId)));
        hasUpvoted = userUpvote.length > 0;
      }

      issuesList.push({
        ...issue,
        authorName,
        upvotesCount,
        hasUpvoted,
      });
    }

    return issuesList;
  }

  async getIssue(id: number, userId?: string): Promise<IssueResponse | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    if (!issue) return undefined;

    const [author] = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, issue.authorId));
    let authorName = "Unknown";
    if (author) {
      authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || "Unknown User";
    }

    const upvoteCount = await db.select({ count: sql<number>`count(*)` }).from(upvotes).where(eq(upvotes.issueId, issue.id));
    const upvotesCount = Number(upvoteCount[0]?.count || 0);

    let hasUpvoted = false;
    if (userId) {
      const userUpvote = await db.select().from(upvotes).where(and(eq(upvotes.issueId, issue.id), eq(upvotes.userId, userId)));
      hasUpvoted = userUpvote.length > 0;
    }

    return {
      ...issue,
      authorName,
      upvotesCount,
      hasUpvoted
    };
  }

  async createIssue(issueData: InsertIssue, authorId: string): Promise<typeof issues.$inferSelect> {
    const [issue] = await db.insert(issues).values({
      ...issueData,
      authorId
    }).returning();
    return issue;
  }

  async toggleUpvote(issueId: number, userId: string): Promise<{ upvotesCount: number, hasUpvoted: boolean }> {
    // Check if upvote exists
    const [existing] = await db.select().from(upvotes).where(
      and(eq(upvotes.issueId, issueId), eq(upvotes.userId, userId))
    );

    if (existing) {
      // Remove upvote
      await db.delete(upvotes).where(
        and(eq(upvotes.issueId, issueId), eq(upvotes.userId, userId))
      );
    } else {
      // Add upvote
      await db.insert(upvotes).values({
        issueId,
        userId
      });
    }

    const upvoteCount = await db.select({ count: sql<number>`count(*)` }).from(upvotes).where(eq(upvotes.issueId, issueId));
    
    return {
      upvotesCount: Number(upvoteCount[0]?.count || 0),
      hasUpvoted: !existing
    };
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(userId: string, profileData: Omit<InsertProfile, 'userId'>): Promise<Profile> {
    const [profile] = await db.insert(profiles)
      .values({ userId, ...profileData })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: profileData
      })
      .returning();
    return profile;
  }
}

export const storage = new DatabaseStorage();
