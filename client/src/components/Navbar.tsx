import { useLocation } from "wouter";
import { LogIn, LogOut, User as UserIcon, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import nagarSetuLogo from "@assets/image_1773048982249.png";
import { BadgePill } from "@/pages/Leaderboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: profile } = useProfile();
  const [location, navigate] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
          <img src={nagarSetuLogo} alt="NagarSetu" className="h-12 w-auto" />
          <div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground block leading-none">NagarSetu</span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate("/")}
            className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Home
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive('/leaderboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>
          {isAuthenticated && (
            <button
              onClick={() => navigate("/issues/new")}
              className={`text-sm font-medium transition-colors ${isActive('/issues/new') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Report Issue
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <Button
                onClick={() => navigate("/issues/new")}
                variant="outline"
                className="hidden md:flex rounded-full border-border/80 hover:bg-primary/5 hover:text-primary"
              >
                Report Issue
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-colors">
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.firstName?.[0] || <UserIcon className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-medium leading-none font-display">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {profile?.badge && (
                        <div className="pt-1"><BadgePill badge={profile.badge} /></div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    Profile & Stats
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/leaderboard")}>
                    <Trophy className="w-4 h-4 mr-2 text-muted-foreground" />
                    Leaderboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              className="rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              onClick={() => { window.location.href = "/api/login"; }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
