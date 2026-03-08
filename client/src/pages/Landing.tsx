import { Link } from "wouter";
import { ArrowRight, MapPin, PenTool, TrendingUp, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10" />
        {/* landing page hero clean modern city street */}
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1920&q=80" 
            alt="City background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-border/50 text-sm font-medium text-primary mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Empowering Citizens, Improving Cities
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground max-w-4xl mx-auto mb-6 leading-[1.1]">
            Report Civic Issues. <br/>
            <span className="text-gradient">Drive Real Change.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect directly with your municipal corporation. Snap a photo, pinpoint the location, and let's work together to build a better community.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
              <a href="/api/login">
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg bg-background/50 backdrop-blur-md hover:bg-background transition-all">
              <a href="#how-it-works">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="how-it-works" className="py-24 bg-card border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How CivicConnect Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A seamless process designed to get municipal issues resolved faster through community participation and transparent tracking.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="w-8 h-8 text-primary" />}
              title="1. Pinpoint the Problem"
              description="Found a pothole or a broken streetlight? Take a photo and drop a pin on the exact location."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-secondary" />}
              title="2. Rally the Community"
              description="Other citizens can upvote your issue, signaling its urgency to the municipal corporation."
            />
            <FeatureCard 
              icon={<Wrench className="w-8 h-8 text-green-500" />}
              title="3. Track Resolutions"
              description="Verified local authorities review, assign, and resolve the most pressing community issues."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-muted/30 border border-border/50 hover:bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-display mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
