import { Link } from "react-router-dom";
import { ArrowLeft, Target, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Simplicity First",
      description: "We believe powerful tools don't have to be complicated. Debt Tracker is designed to be intuitive from day one."
    },
    {
      icon: Heart,
      title: "Built for Suppliers",
      description: "Every feature is designed with small suppliers in mind. We understand your challenges because we've been there."
    },
    {
      icon: Zap,
      title: "Speed Matters",
      description: "Your time is valuable. That's why everything in Debt Tracker can be done in seconds, not hours."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <span className="font-bold text-xl text-foreground">Debt Tracker</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              About Debt Tracker
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              We're on a mission to help small suppliers get paid on time, every time.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-4">
                Debt Tracker was born out of frustration. As small business owners ourselves, we spent 
                countless hours chasing payments, sending manual reminders, and trying to keep 
                track of who owed us what.
              </p>
              <p className="text-muted-foreground text-lg mb-4">
                We realized that small suppliers across Kenya and East Africa face the same 
                challenges: delayed payments that hurt cash flow, messy records that make 
                tracking impossible, and the time-consuming task of following up with customers.
              </p>
              <p className="text-muted-foreground text-lg">
                That's why we built Debt Tracker — a simple, affordable tool that does one thing 
                really well: helps you get paid faster. No complicated features, no steep 
                learning curve. Just straightforward invoice tracking and reminders that work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-12 text-center">
              What We Believe
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {values.map((value, index) => (
                <Card key={index} className="border-border/50 bg-card">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join hundreds of suppliers who are already getting paid faster with Debt Tracker.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="font-semibold">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Debt Tracker. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default About;