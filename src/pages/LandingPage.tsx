import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScrollReveal from "@/components/ScrollReveal";
import PaymentCallbackHandler from "@/components/PaymentCallbackHandler";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageCircle, 
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Quote,
  Clock,
  AlertTriangle,
  FileSearch
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      description: "See all unpaid invoices in seconds"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "One place for all contacts"
    },
    {
      icon: FileText,
      title: "Statements",
      description: "PDF-ready, professional, and easy to send"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Reminders",
      description: "Copy & send in one click"
    },
    {
      icon: Smartphone,
      title: "Mobile-Friendly",
      description: "Work from your phone anywhere"
    }
  ];

  const painPoints = [
    { icon: Clock, text: "Customers delay payments?" },
    { icon: FileSearch, text: "Lost invoices and messy records?" },
    { icon: AlertTriangle, text: "Manual WhatsApp reminders taking hours?" }
  ];

  const solutionItems = [
    "Track outstanding invoices in one dashboard",
    "Generate professional PDF statements instantly",
    "Auto-generate WhatsApp reminders your customers actually read",
    "Know who owes you, and when, at a glance"
  ];

  const testimonials = [
    {
      quote: "I started using this tool last month — I've already collected 30% more payments on time.",
      name: "Mary",
      role: "Hardware Supplier, Nairobi",
      initial: "M"
    },
    {
      quote: "Before Debt Tracker, I spent hours every week chasing payments. Now it takes me 10 minutes. My customers actually pay faster because the reminders are professional.",
      name: "James Ochieng",
      role: "Wholesale Distributor, Kisumu",
      initial: "J"
    },
    {
      quote: "The PDF statements look so professional that my customers take them seriously. I've reduced my overdue invoices by 50% in just two months.",
      name: "Grace Wanjiku",
      role: "Food Supplier, Mombasa",
      initial: "G"
    }
  ];

  const faqs = [
    {
      question: "How does the 7-day free trial work?",
      answer: "Start using Debt Tracker immediately with full access to all features. No credit card required. After 7 days, choose a plan that works for you or your data stays safe until you're ready."
    },
    {
      question: "Can I use Debt Tracker on my phone?",
      answer: "Absolutely! Debt Tracker is fully mobile-friendly. Add invoices, generate statements, and send WhatsApp reminders directly from your smartphone — perfect for suppliers on the go."
    },
    {
      question: "How do WhatsApp reminders work?",
      answer: "Debt Tracker auto-generates professional reminder messages with your customer's name, invoice details, and amount due. Simply tap to copy and paste into WhatsApp, or open WhatsApp directly with the message ready to send."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. Your customer and invoice data is encrypted and stored securely. Only you have access to your account and information."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or hidden fees. Your data remains accessible even after cancellation."
    },
    {
      question: "Do my customers need to create an account?",
      answer: "No! Your customers never need to log in or create accounts. They simply receive PDF statements via email or WhatsApp reminders — simple and hassle-free for everyone."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Payment Callback Handler */}
      <PaymentCallbackHandler />
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <span className="font-bold text-xl text-foreground">Debt Tracker</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" className="font-semibold">Start Free Trial</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <ScrollReveal>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Stop Chasing Late Payments — 
                <span className="text-accent"> Track, Remind, and Get Paid on Time!</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                The simplest tool for small suppliers to track unpaid invoices, generate statements, and send WhatsApp reminders — in just 30 seconds.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all">
                    Start Free 7-Day Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required — start getting paid faster today.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">
                Sound familiar?
              </h2>
            </ScrollReveal>
            <div className="grid gap-6 md:grid-cols-3">
              {painPoints.map((point, index) => (
                <ScrollReveal key={index} delay={index * 0.1} direction="scale">
                  <Card className="border-destructive/20 bg-destructive/5 card-hover h-full">
                    <CardContent className="pt-6 text-center">
                      <point.icon className="h-10 w-10 mx-auto mb-4 text-destructive" />
                      <p className="font-medium text-foreground">{point.text}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={0.3}>
              <p className="mt-10 text-lg text-muted-foreground">
                You're not alone. Every small supplier struggles with late payments — <span className="font-semibold text-destructive">and it kills cash flow.</span>
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Debt Tracker makes it <span className="text-accent">effortless</span>
              </h2>
            </ScrollReveal>
            <div className="mt-12 grid gap-6 text-left max-w-2xl mx-auto">
              {solutionItems.map((item, index) => (
                <ScrollReveal key={index} delay={index * 0.1} direction="left">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-foreground">{item}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={0.4}>
              <p className="mt-10 text-lg text-muted-foreground font-medium">
                Stop wasting time chasing payments. <span className="text-accent">Focus on growing your business instead.</span>
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Everything you need to get paid
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 0.08} direction="up">
                <Card className="card-hover border-border/50 bg-card h-full">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">
                      ✅ {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Trusted by suppliers across Kenya
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 0.1} direction="up">
                <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 to-transparent h-full">
                  <CardContent className="pt-6 pb-6 px-6">
                    <Quote className="h-8 w-8 text-accent/30 mb-3" />
                    <blockquote className="text-foreground font-medium leading-relaxed mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold text-sm">{testimonial.initial}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-lg">Everything you need to know about Debt Tracker</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                    <AccordionTrigger className="text-left text-foreground hover:text-accent hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground text-lg">Perfect for small suppliers</p>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            <ScrollReveal delay={0.1} direction="right">
              <Card className="border-border bg-card card-hover h-full">
                <CardContent className="pt-8 text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">Monthly</h3>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    KES 1,000<span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground mb-6">Perfect for small suppliers</p>
                  <Link to="/pricing">
                    <Button className="w-full" variant="outline">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.2} direction="left">
              <Card className="border-accent bg-card relative overflow-hidden card-hover h-full">
                <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  SAVE 2 MONTHS
                </div>
                <CardContent className="pt-8 text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">Yearly</h3>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    KES 10,000<span className="text-lg font-normal text-muted-foreground">/year</span>
                  </div>
                  <p className="text-muted-foreground mb-6">Save 2 months</p>
                  <Link to="/pricing">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.3}>
            <p className="text-center mt-8 text-accent font-medium">
              ✨ Free 7-day trial — start without risk
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Don't let unpaid invoices hold your business back
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Start today and see results in your first week!
              </p>
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-semibold">
                  Start Free 7-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <ScrollReveal>
            <div className="grid gap-8 md:grid-cols-4 mb-8">
              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">D</span>
                  </div>
                  <span className="font-bold text-lg text-foreground">Debt Tracker</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The simplest tool for small suppliers to track invoices and get paid on time.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                  <li><Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
                  <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-6 border-t border-border text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Works on phone or computer
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                100% local supplier-friendly
              </span>
            </div>

            {/* Copyright */}
            <div className="pt-6 border-t border-border text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Debt Tracker. All rights reserved.
            </div>
          </ScrollReveal>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
