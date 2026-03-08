import { z } from "zod";
import { insertIssueSchema, insertProfileSchema, issues, profiles } from "./schema";

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
        200: z.array(z.custom<typeof issues.$inferSelect & { authorName?: string | null, upvotesCount: number, hasUpvoted: boolean }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/issues/:id' as const,
      responses: {
        200: z.custom<typeof issues.$inferSelect & { authorName?: string | null, upvotesCount: number, hasUpvoted: boolean }>(),
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
      input: insertProfileSchema.omit({ userId: true }),
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
export type IssueResponse = z.infer<typeof api.issues.create.responses[201]>;
export type IssuesListResponse = z.infer<typeof api.issues.list.responses[200]>;
export type ProfileInput = z.infer<typeof api.profile.upsert.input>;
export type ProfileResponse = z.infer<typeof api.profile.upsert.responses[200]>;
