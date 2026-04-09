import { pgTable, text, serial, timestamp, varchar, integer, primaryKey, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
export * from "./models/auth";

export const profiles = pgTable("profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  aadhaarNumber: text("aadhaar_number").notNull(),
  points: integer("points").notNull().default(0),
  badge: text("badge").notNull().default("citizen"),
});

// Municipal corporations (separate auth, not Replit Auth)
export const municipalCorps = pgTable("municipal_corps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ward: text("ward").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admins (District Magistrate, separate auth)
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  wardArea: text("ward_area"),
  maintenanceType: text("maintenance_type").notNull(),
  imageUrl: text("image_url"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  assignedMunicipalId: integer("assigned_municipal_id").references(() => municipalCorps.id),
  claimedAt: timestamp("claimed_at"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNote: text("resolution_note"),
  isEscalated: boolean("is_escalated").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upvotes = pgTable("upvotes", {
  userId: varchar("user_id").notNull().references(() => users.id),
  issueId: integer("issue_id").notNull().references(() => issues.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.issueId] })
]);

// Issue status change log (for full timeline)
export const issueLogs = pgTable("issue_logs", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").notNull().references(() => issues.id),
  status: text("status").notNull(),
  note: text("note"),
  changedBy: text("changed_by").notNull(),
  changedByType: text("changed_by_type").notNull().default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Point log for citizens
export const pointLogs = pgTable("point_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  pointsChange: integer("points_change").notNull(),
  reason: text("reason").notNull(),
  issueId: integer("issue_id").references(() => issues.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Insert Schemas ---
export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  authorId: true,
  createdAt: true,
  status: true,
  assignedMunicipalId: true,
  claimedAt: true,
  resolvedAt: true,
  resolutionNote: true,
  isEscalated: true,
});

export const insertProfileSchema = createInsertSchema(profiles);

export const insertMunicipalCorpSchema = createInsertSchema(municipalCorps).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
});

// --- Types ---
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type MunicipalCorp = typeof municipalCorps.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type IssueLog = typeof issueLogs.$inferSelect;
export type PointLog = typeof pointLogs.$inferSelect;

export type CreateIssueRequest = InsertIssue;
export type IssueResponse = Issue & {
  authorName?: string | null;
  authorBadge?: string | null;
  upvotesCount: number;
  hasUpvoted: boolean;
  municipalName?: string | null;
  daysOpen: number;
  logs?: IssueLog[];
};

export type LeaderboardEntry = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  points: number;
  badge: string;
  issuesReported: number;
  rank: number;
};
