import { useState } from "react";
import { useMunicipalAuth } from "@/hooks/use-municipal-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function MunicipalLogin() {
  const { login, isLoggingIn, loginError, isAuthenticated } = useMunicipalAuth();
  const [_, navigate] = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });

  if (isAuthenticated) {
    navigate("/municipal/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#A0D585]/10 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6984A9] text-white mb-4 shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Municipal Portal</h1>
          <p className="text-muted-foreground">Municipal Corporation Staff Login</p>
        </div>

        <Card className="p-8 rounded-3xl border-border/60 shadow-lg">
          <form onSubmit={(e) => { e.preventDefault(); login(form); }} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                data-testid="input-municipal-username"
                placeholder="ward1_muni"
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
                data-testid="input-municipal-password"
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
              data-testid="button-municipal-login"
              disabled={isLoggingIn}
              className="w-full h-12 rounded-xl shadow-lg bg-[#6984A9] hover:bg-[#263B6A] text-white"
            >
              {isLoggingIn ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</> : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
            <p className="font-medium mb-1">Demo credentials (all use password: muni123):</p>
            <p>• <code className="bg-background px-1 rounded">ward1_muni</code> – Ward 1 Central</p>
            <p>• <code className="bg-background px-1 rounded">ward2_muni</code> – Ward 2 North</p>
            <p>• <code className="bg-background px-1 rounded">ward3_muni</code> – Ward 3 South</p>
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
