import { useLocation } from "wouter";
import { MapPin } from "lucide-react";

export function Footer() {
  const [_, navigate] = useLocation();

  return (
    <footer className="border-t border-border/50 bg-muted/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-foreground">NagarSetu</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering citizens to create better communities through transparent civic engagement.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </a>
              </li>
              <li>
                <button onClick={() => navigate("/issues/new")} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Report Issue
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} NagarSetu. All rights reserved. Making cities better, one report at a time.
          </p>
        </div>
      </div>
    </footer>
  );
}
