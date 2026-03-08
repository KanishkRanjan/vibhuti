import { Link } from "wouter";
import { ArrowRight, MapPin, Users, Wrench, CheckCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Image */}
      <section className="relative overflow-hidden pt-0 pb-0">
        <div className="relative h-[500px] md:h-[600px] w-full">
          {/* Background Image */}
          <img 
            src="https://pibindia.wordpress.com/wp-content/uploads/2017/09/swatch-bharat-inner-new.jpg" 
            alt="Clean India Mission" 
            className="w-full h-full object-cover"
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 dark:bg-slate-900/40 backdrop-blur-md border border-white/30 text-sm font-medium text-white mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Empowering Citizens for Better Cities
              </div>
              
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white max-w-4xl mx-auto mb-6 leading-[1.1]">
                NagarSetu
              </h1>
              
              <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                Report civic issues directly to your municipal corporation. Together, let's build cleaner, safer, and better communities.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg bg-secondary hover:bg-secondary/90 text-foreground shadow-xl shadow-secondary/30 hover:shadow-2xl hover:shadow-secondary/40 transition-all hover:-translate-y-1">
                  <a href="/api/login">
                    Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 transition-all">
                  <a href="#how-it-works">Learn More</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="how-it-works" className="py-24 bg-card border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-foreground">How NagarSetu Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A seamless process designed to get municipal issues resolved faster through community participation and transparent tracking.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="w-8 h-8 text-primary" />}
              title="1. Report the Issue"
              description="Found a pothole, broken streetlight, or drainage problem? Take a photo and pinpoint the exact location on the map."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-secondary" />}
              title="2. Community Support"
              description="Other citizens can upvote your issue and add comments, signaling its urgency to municipal authorities."
            />
            <FeatureCard 
              icon={<Wrench className="w-8 h-8 text-accent" />}
              title="3. Track Resolution"
              description="Verified local authorities review, assign, and resolve the most pressing community issues with full transparency."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-foreground">Why Choose NagarSetu?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Bringing transparency and efficiency to civic issue management.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <BenefitItem 
              icon={<CheckCircle className="w-6 h-6" />}
              title="Real-time Tracking"
              description="Monitor the status of reported issues from submission to resolution in real-time."
            />
            <BenefitItem 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Data-Driven Impact"
              description="See aggregated data showing which areas need the most attention and resources."
            />
            <BenefitItem 
              icon={<Users className="w-6 h-6" />}
              title="Community Power"
              description="Your voice matters. Upvote issues to amplify their importance to local authorities."
            />
            <BenefitItem 
              icon={<Wrench className="w-6 h-6" />}
              title="Efficient Resolution"
              description="Streamlined workflow ensures issues are prioritized and resolved faster than traditional methods."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-white">Ready to Make a Difference?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">Join thousands of citizens working together to build cleaner, safer, and better communities.</p>
          <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg bg-background text-primary hover:bg-background/90 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <a href="/api/login">
              Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
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
      <h3 className="text-xl font-bold font-display mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-secondary">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold font-display mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
