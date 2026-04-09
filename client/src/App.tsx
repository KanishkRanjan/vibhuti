import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

// Components
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AadhaarPrompt } from "@/components/AadhaarPrompt";
import NotFound from "@/pages/not-found";

// Citizen Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CreateIssue from "@/pages/CreateIssue";
import Profile from "@/pages/Profile";
import IssueDetail from "@/pages/IssueDetail";
import Leaderboard from "@/pages/Leaderboard";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminMunicipalDetail from "@/pages/admin/AdminMunicipalDetail";

// Municipal Pages
import MunicipalLogin from "@/pages/municipal/MunicipalLogin";
import MunicipalDashboard from "@/pages/municipal/MunicipalDashboard";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return <Component />;
}

function HomeRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return (
    <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return isAuthenticated ? <Dashboard /> : <Landing />;
}

// Standalone pages (admin/municipal) without citizen navbar/footer
function StandaloneRoute({ component: Component }: { component: React.ComponentType }) {
  return <Component />;
}

function CitizenRouter() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <AadhaarPrompt />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomeRouter} />
          <Route path="/issues/new">{() => <ProtectedRoute component={CreateIssue} />}</Route>
          <Route path="/issues/detail">{() => <ProtectedRoute component={IssueDetail} />}</Route>
          <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
          <Route path="/leaderboard" component={Leaderboard} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin Portal (standalone, no citizen nav) */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/municipal/:id" component={AdminMunicipalDetail} />
      <Route path="/admin/municipals" component={AdminDashboard} />

      {/* Municipal Portal (standalone) */}
      <Route path="/municipal/login" component={MunicipalLogin} />
      <Route path="/municipal/dashboard" component={MunicipalDashboard} />

      {/* Citizen App */}
      <Route component={CitizenRouter} />
    </Switch>
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
