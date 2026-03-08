import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type IssueInput } from "@shared/routes";

function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useIssues() {
  return useQuery({
    queryKey: [api.issues.list.path],
    queryFn: async () => {
      const res = await fetch(api.issues.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch issues");
      const data = await res.json();
      return parseWithLogging(api.issues.list.responses[200], data, "issues.list");
    },
  });
}

export function useIssue(id: number) {
  return useQuery({
    queryKey: [api.issues.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.issues.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch issue");
      const data = await res.json();
      return parseWithLogging(api.issues.get.responses[200], data, `issues.get.${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IssueInput) => {
      const res = await fetch(api.issues.create.path, {
        method: api.issues.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Validation failed");
        }
        throw new Error("Failed to create issue");
      }
      
      const responseData = await res.json();
      return parseWithLogging(api.issues.create.responses[201], responseData, "issues.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.issues.list.path] });
    },
  });
}

export function useToggleUpvote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.issues.toggleUpvote.path, { id });
      const res = await fetch(url, {
        method: api.issues.toggleUpvote.method,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to upvote");
      }
      const data = await res.json();
      return parseWithLogging(api.issues.toggleUpvote.responses[200], data, `issues.upvote.${id}`);
    },
    onSuccess: (_, id) => {
      // Invalidate both the list and the specific item
      queryClient.invalidateQueries({ queryKey: [api.issues.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.issues.get.path, id] });
    },
  });
}
