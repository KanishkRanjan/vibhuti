import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

// Components
import { Navbar } from "@/components/Navbar";
import { AadhaarPrompt } from "@/components/AadhaarPrompt";
import NotFound from "@/pages/not-found";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreateIssue from "@/pages/CreateIssue";
import Profile from "@/pages/Profile";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }
  
  return <Component />;
}

function HomeRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  
  return isAuthenticated ? <Dashboard /> : <Landing />;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <AadhaarPrompt />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomeRouter} />
          <Route path="/issues/new">
            {() => <ProtectedRoute component={CreateIssue} />}
          </Route>
          <Route path="/profile">
            {() => <ProtectedRoute component={Profile} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
