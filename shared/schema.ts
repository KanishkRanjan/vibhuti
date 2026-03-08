import { pgTable, text, serial, timestamp, varchar, integer, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
export * from "./models/auth";

export const profiles = pgTable("profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  aadhaarNumber: text("aadhaar_number").notNull(),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  maintenanceType: text("maintenance_type").notNull(),
  imageUrl: text("image_url"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upvotes = pgTable("upvotes", {
  userId: varchar("user_id").notNull().references(() => users.id),
  issueId: integer("issue_id").notNull().references(() => issues.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.issueId] })
]);

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles);

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type CreateIssueRequest = InsertIssue;
export type IssueResponse = Issue & { 
  authorName?: string | null;
  upvotesCount: number;
  hasUpvoted: boolean;
};
