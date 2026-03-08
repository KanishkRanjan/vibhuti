import { db } from "./db";
import { issues, profiles, upvotes } from "@shared/schema";
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
    const allIssues = await db.query.issues.findMany({
      orderBy: [desc(issues.createdAt)],
      with: {
        // author connection is defined indirectly via users table, doing manual join to be safe
      }
    });

    // Instead of using complex Drizzle relations, we'll do raw SQL for stats for robustness, or manual fetching
    const issuesList: IssueResponse[] = [];
    
    for (const issue of allIssues) {
      // Get author name
      const [author] = await db.execute(sql`SELECT first_name, last_name FROM users WHERE id = ${issue.authorId}`);
      let authorName = "Unknown";
      if (author) {
        authorName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || "Unknown User";
      }

      // Get upvotes count
      const [upvoteCountResult] = await db.execute(sql`SELECT COUNT(*) FROM upvotes WHERE issue_id = ${issue.id}`);
      const upvotesCount = Number(upvoteCountResult?.count || 0);

      // Check if current user has upvoted
      let hasUpvoted = false;
      if (userId) {
        const [userUpvote] = await db.execute(sql`SELECT 1 FROM upvotes WHERE issue_id = ${issue.id} AND user_id = ${userId}`);
        hasUpvoted = !!userUpvote;
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

    const [author] = await db.execute(sql`SELECT first_name, last_name FROM users WHERE id = ${issue.authorId}`);
    let authorName = "Unknown";
    if (author) {
      authorName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || "Unknown User";
    }

    const [upvoteCountResult] = await db.execute(sql`SELECT COUNT(*) FROM upvotes WHERE issue_id = ${issue.id}`);
    const upvotesCount = Number(upvoteCountResult?.count || 0);

    let hasUpvoted = false;
    if (userId) {
      const [userUpvote] = await db.execute(sql`SELECT 1 FROM upvotes WHERE issue_id = ${issue.id} AND user_id = ${userId}`);
      hasUpvoted = !!userUpvote;
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

    const [upvoteCountResult] = await db.execute(sql`SELECT COUNT(*) FROM upvotes WHERE issue_id = ${issueId}`);
    
    return {
      upvotesCount: Number(upvoteCountResult?.count || 0),
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
