import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

type AdminUser = { id: number; name: string; username: string };

async function fetchAdmin(): Promise<AdminUser | null> {
  const res = await fetch("/api/admin/me", { credentials: "include" });
  if (res.status === 401) return null;
  return res.json();
}

export function useAdminAuth() {
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();

  const { data: admin, isLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: fetchAdmin,
    staleTime: 60000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      navigate("/admin/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/me"], null);
      navigate("/admin/login");
    },
  });

  return {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
