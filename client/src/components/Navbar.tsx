import { useLocation } from "wouter";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import nagarSetuLogo from "@assets/image_1773048982249.png";
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
          <a href="#" className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
            Community
          </a>
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
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-colors">
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.firstName?.[0] || <UserIcon className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none font-display">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild className="rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <a href="/api/login">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
