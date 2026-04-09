import { z } from "zod";
import { insertIssueSchema, insertProfileSchema, issues, profiles } from "./schema";
import type { IssueResponse as IssueResponseType, LeaderboardEntry } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  issues: {
    list: {
      method: 'GET' as const,
      path: '/api/issues' as const,
      responses: {
        200: z.array(z.custom<IssueResponseType>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/issues/:id' as const,
      responses: {
        200: z.custom<IssueResponseType>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/issues' as const,
      input: insertIssueSchema,
      responses: {
        201: z.custom<typeof issues.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    toggleUpvote: {
      method: 'POST' as const,
      path: '/api/issues/:id/upvote' as const,
      responses: {
        200: z.object({ upvotesCount: z.number(), hasUpvoted: z.boolean() }),
        404: errorSchemas.notFound,
      }
    }
  },
  profile: {
    get: {
      method: 'GET' as const,
      path: '/api/profile' as const,
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    upsert: {
      method: 'POST' as const,
      path: '/api/profile' as const,
      input: insertProfileSchema.omit({ userId: true, points: true, badge: true }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type IssueInput = z.infer<typeof api.issues.create.input>;
export type IssueResponse = IssueResponseType;
export type IssuesListResponse = IssueResponseType[];
export type ProfileInput = z.infer<typeof api.profile.upsert.input>;
export type ProfileResponse = z.infer<typeof api.profile.upsert.responses[200]>;
export type { LeaderboardEntry };
