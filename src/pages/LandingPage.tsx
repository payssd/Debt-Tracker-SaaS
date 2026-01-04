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
  FileSearch,
  Play,
  UserPlus,
  PlusCircle,
  Send,
  Banknote
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      description: "See all overdue rent and shop debts in seconds"
    },
    {
      icon: Users,
      title: "Tenant / Customer Management",
      description: "One place for all contacts"
    },
    {
      icon: FileText,
      title: "Statements",
      description: "PDF-ready, professional, easy to send"
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
    { icon: Clock, text: "Tenants delay rent payments?" },
    { icon: FileSearch, text: "Customers skip shop payments?" },
    { icon: AlertTriangle, text: "Messy records and lost payment info?" },
    { icon: MessageCircle, text: "Manual WhatsApp reminders taking hours?" }
  ];

  const solutionItems = [
    "Track outstanding payments in one dashboard",
    "Generate professional PDF rent or shop statements instantly",
    "Auto-generate WhatsApp reminders your tenants/customers actually read",
    "Know who owes you, and when, at a glance"
  ];

  const testimonials = [
    {
      quote: "I started using Debt Tracker last month — I've already collected 30% more rent on time.",
      name: "Mary",
      role: "Landlord, Nairobi",
      initial: "M"
    },
    {
      quote: "Before Debt Tracker, I spent hours every week chasing shop payments. Now it takes me 10 minutes. Customers actually pay faster because reminders are professional.",
      name: "James Ochieng",
      role: "Shop Owner, Kisumu",
      initial: "J"
    },
    {
      quote: "The PDF statements look so professional that tenants take them seriously. I've reduced my overdue rent by 50% in just two months.",
      name: "Grace Wanjiku",
      role: "Property Manager, Mombasa",
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
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
        
        {/* Floating Elements */}
        <div className="absolute top-32 right-[15%] hidden lg:block animate-bounce delay-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Payment Received!</p>
                <p className="text-xs text-muted-foreground">Ksh 15,000 from John</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-48 left-[5%] hidden xl:block animate-bounce delay-700">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Reminder Sent</p>
                <p className="text-xs text-muted-foreground">via WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container relative z-10 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Social Proof Badge */}
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-accent/80 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">M</div>
                    <div className="w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">J</div>
                    <div className="w-6 h-6 rounded-full bg-accent border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">G</div>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Join <span className="text-accent font-bold">500+</span> Kenyan landlords
                  </span>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                  Get Paid <span className="text-accent">On Time,</span>
                  <br />
                  Every Time
                </h1>
              </ScrollReveal>
              
              <ScrollReveal delay={0.2}>
                <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  Track rent & debts, send WhatsApp reminders, and generate professional statements — all in <span className="font-semibold text-accent">30 seconds</span>.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                  <Link to="/dashboard">
                    <Button size="lg" className="text-lg px-8 py-6 font-semibold shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all hover:scale-105">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-semibold hover:bg-accent/5">
                      <Play className="mr-2 h-5 w-5" />
                      See How It Works
                    </Button>
                  </a>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.4}>
                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    7-day free trial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    Cancel anytime
                  </span>
                </div>
              </ScrollReveal>
            </div>

            {/* Right - Dashboard Mockup */}
            <ScrollReveal delay={0.3} direction="right">
              <div className="relative lg:block">
                {/* Main Dashboard Preview */}
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-accent/20 border border-accent/10 overflow-hidden">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                        debttracker.app/dashboard
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-6 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-accent/10 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-accent">12</p>
                        <p className="text-xs text-muted-foreground">Customers</p>
                      </div>
                      <div className="bg-red-500/10 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-500">3</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                      <div className="bg-green-500/10 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-500">Ksh 45k</p>
                        <p className="text-xs text-muted-foreground">Collected</p>
                      </div>
                    </div>
                    
                    {/* Customer List Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">JK</div>
                          <div>
                            <p className="text-sm font-medium text-foreground">John Kamau</p>
                            <p className="text-xs text-muted-foreground">Room 5A</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-red-500">Ksh 15,000</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-600">MW</div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Mary Wanjiku</p>
                            <p className="text-xs text-muted-foreground">Shop 12</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-green-500">Paid ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent/20 rounded-2xl blur-xl" />
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-accent/30 rounded-xl blur-lg" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-accent/5 to-background">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                SIMPLE 4-STEP PROCESS
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Get Paid in <span className="text-accent">4 Easy Steps</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From signup to getting paid — it takes less than 5 minutes
              </p>
            </div>
          </ScrollReveal>

          {/* Steps Container */}
          <div className="relative max-w-5xl mx-auto">
            {/* Connection Line (Desktop) */}
            <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-1 bg-gradient-to-r from-accent/20 via-accent to-accent/20 rounded-full" />
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Step 1 */}
              <ScrollReveal delay={0} direction="up">
                <div className="relative text-center group">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/25 group-hover:scale-110 transition-transform duration-300">
                      <UserPlus className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Sign Up Free</h3>
                  <p className="text-muted-foreground text-sm">
                    Create your account in 30 seconds. No credit card needed.
                  </p>
                </div>
              </ScrollReveal>

              {/* Step 2 */}
              <ScrollReveal delay={0.1} direction="up">
                <div className="relative text-center group">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                      <PlusCircle className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Add Invoices</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter your customer details and unpaid invoices quickly.
                  </p>
                </div>
              </ScrollReveal>

              {/* Step 3 */}
              <ScrollReveal delay={0.2} direction="up">
                <div className="relative text-center group">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                      <Send className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Send Reminders</h3>
                  <p className="text-muted-foreground text-sm">
                    One-click WhatsApp reminders your customers actually read.
                  </p>
                </div>
              </ScrollReveal>

              {/* Step 4 */}
              <ScrollReveal delay={0.3} direction="up">
                <div className="relative text-center group">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25 group-hover:scale-110 transition-transform duration-300">
                      <Banknote className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                      4
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Get Paid! 💰</h3>
                  <p className="text-muted-foreground text-sm">
                    Watch your payments come in faster than ever before.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Bottom CTA */}
          <ScrollReveal delay={0.4}>
            <div className="text-center mt-12">
              <Link to="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all">
                  Try It Free — Takes 30 Seconds
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
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
                You're not alone. Every landlord and shop owner struggles with late payments — <span className="font-semibold text-destructive">and it kills cash flow.</span>
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
                Stop wasting time chasing payments. <span className="text-accent">Focus on growing your property or shop business instead.</span>
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
                Everything you need to get paid on time
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
                Trusted by landlords & shop owners across Kenya
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
              <p className="text-muted-foreground text-lg">Perfect for landlords & shop owners — unlock all features</p>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <ScrollReveal delay={0.1} direction="right">
              <Card className="border-border bg-card card-hover h-full">
                <CardContent className="pt-8">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">Monthly</h3>
                    <div className="text-4xl font-bold text-foreground mb-2">
                      KES 1,000<span className="text-lg font-normal text-muted-foreground">/month</span>
                    </div>
                    <p className="text-muted-foreground">Flexible monthly billing</p>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Unlimited tenants/customers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Unlimited invoices & statements</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Auto overdue tracking & alerts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>WhatsApp reminder templates</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Professional PDF statements</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Dashboard analytics</span>
                    </div>
                  </div>
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
                <CardContent className="pt-8">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">Yearly</h3>
                    <div className="text-4xl font-bold text-foreground mb-2">
                      KES 10,000<span className="text-lg font-normal text-muted-foreground">/year</span>
                    </div>
                    <p className="text-muted-foreground">Save KES 2,000 yearly</p>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Unlimited tenants/customers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Unlimited invoices & statements</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Auto overdue tracking & alerts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>WhatsApp reminder templates</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Professional PDF statements</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>Dashboard analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span className="font-medium text-accent">Priority support</span>
                    </div>
                  </div>
                  <Link to="/pricing">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.3}>
            <p className="text-center mt-8 text-accent font-medium">
              ✨ Free 7-day trial — full access to all features, no credit card required
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
                Don't let unpaid rent or shop payments hold your business back
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
                  The simplest tool for Kenyan landlords and shop owners to track payments and get paid on time.
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
                100% local landlord/shop-owner-friendly
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
