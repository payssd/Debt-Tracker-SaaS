import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
  };

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

      {/* Content */}
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about Debt Tracker? We're here to help. Reach out and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        We'll respond within 24 hours
                      </p>
                      <a href="mailto:support@debtflow.app" className="text-accent hover:underline">
                        support@debtflow.app
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">WhatsApp Support</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Quick responses during business hours
                      </p>
                      <a href="https://wa.me/254700000000" className="text-accent hover:underline">
                        +254 700 000 000
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Location</h3>
                      <p className="text-muted-foreground text-sm">
                        Nairobi, Kenya<br />
                        Serving suppliers across East Africa
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us more about your inquiry..." 
                      rows={5}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Debt Tracker. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Contact;