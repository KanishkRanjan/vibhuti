import { useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const { login, isLoggingIn, loginError, isAuthenticated } = useAdminAuth();
  const [_, navigate] = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });

  if (isAuthenticated) {
    navigate("/admin/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEFABD]/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">District Magistrate Access</p>
        </div>

        <Card className="p-8 rounded-3xl border-border/60 shadow-lg">
          <form onSubmit={(e) => { e.preventDefault(); login(form); }} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                data-testid="input-admin-username"
                placeholder="dm_admin"
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                className="h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-admin-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="h-12 rounded-xl"
                required
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(loginError as Error).message}
              </div>
            )}

            <Button
              type="submit"
              data-testid="button-admin-login"
              disabled={isLoggingIn}
              className="w-full h-12 rounded-xl shadow-lg"
            >
              {isLoggingIn ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</> : "Sign In as DM"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
            <p className="font-medium mb-1">Demo credentials:</p>
            <p>Username: <code className="bg-background px-1 rounded">dm_admin</code></p>
            <p>Password: <code className="bg-background px-1 rounded">admin123</code></p>
          </div>
        </Card>

        <div className="text-center mt-6">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to NagarSetu
          </button>
        </div>
      </div>
    </div>
  );
}
