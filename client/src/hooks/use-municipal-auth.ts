import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

type MunicipalUser = { id: number; name: string; username: string; ward: string };

async function fetchMunicipal(): Promise<MunicipalUser | null> {
  const res = await fetch("/api/municipal/me", { credentials: "include" });
  if (res.status === 401) return null;
  return res.json();
}

export function useMunicipalAuth() {
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();

  const { data: municipal, isLoading } = useQuery({
    queryKey: ["/api/municipal/me"],
    queryFn: fetchMunicipal,
    staleTime: 60000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/municipal/login", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/municipal/me"] });
      navigate("/municipal/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/municipal/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/municipal/me"], null);
      navigate("/municipal/login");
    },
  });

  return {
    municipal,
    isAuthenticated: !!municipal,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
