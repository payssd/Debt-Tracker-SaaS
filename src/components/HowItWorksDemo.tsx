import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  FileText,
  AlertTriangle,
  MessageCircle,
  Download,
  Bell,
  CheckCircle2,
  ArrowRight,
  Clock,
  Calendar,
  Send,
} from 'lucide-react';

interface HowItWorksDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksDemo: React.FC<HowItWorksDemoProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  const steps = [
    {
      title: "Welcome to Debt Tracker",
      subtitle: "See how easy it is to get paid on time",
      icon: Play,
    },
    {
      title: "Add Your Customers",
      subtitle: "Quickly add tenants or shop customers",
      icon: Users,
    },
    {
      title: "Create Invoices",
      subtitle: "Track rent, debts, and due dates",
      icon: FileText,
    },
    {
      title: "Track Overdue Payments",
      subtitle: "See who owes you at a glance",
      icon: AlertTriangle,
    },
    {
      title: "Send WhatsApp Reminders",
      subtitle: "One-click professional reminders",
      icon: MessageCircle,
    },
    {
      title: "Download PDF Statements",
      subtitle: "Professional statements your customers respect",
      icon: Download,
    },
    {
      title: "Auto Reminders",
      subtitle: "Set it and forget it - we remind them for you",
      icon: Bell,
    },
  ];

  // Auto-advance
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setAnimationKey(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, isOpen, steps.length]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsPlaying(true);
      setAnimationKey(0);
    }
  }, [isOpen]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setAnimationKey(prev => prev + 1);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setAnimationKey(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setAnimationKey(prev => prev + 1);
    }
  };

  if (!isOpen) return null;

  // Render different dashboard states based on step
  const renderDashboardContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-6 animate-bounce">
              <Play className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Welcome to Debt Tracker</h3>
            <p className="text-muted-foreground">Let's see how you can get paid faster</p>
          </div>
        );

      case 1: // Add Customer
        return (
          <div className="p-6 space-y-4 animate-fade-in" key={animationKey}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customers</h3>
              <Button size="sm" className="animate-pulse bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-1" /> Add Customer
              </Button>
            </div>
            
            {/* Animated Form */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border-2 border-accent animate-scale-in">
              <p className="text-sm font-medium mb-3 text-accent">New Customer</p>
              <div className="space-y-3">
                <div className="h-10 bg-white dark:bg-slate-700 rounded-lg border flex items-center px-3">
                  <span className="text-sm text-foreground animate-typing overflow-hidden whitespace-nowrap">John Kamau</span>
                </div>
                <div className="h-10 bg-white dark:bg-slate-700 rounded-lg border flex items-center px-3">
                  <span className="text-sm text-foreground animate-typing-delay overflow-hidden whitespace-nowrap">+254 712 345 678</span>
                </div>
                <div className="h-10 bg-white dark:bg-slate-700 rounded-lg border flex items-center px-3">
                  <span className="text-sm text-foreground">Room 5A - Kilimani Apartments</span>
                </div>
              </div>
            </div>

            {/* Existing customers */}
            <div className="space-y-2 opacity-50">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">MW</div>
                <div>
                  <p className="text-sm font-medium">Mary Wanjiku</p>
                  <p className="text-xs text-muted-foreground">Shop 12</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Create Invoice
        return (
          <div className="p-6 space-y-4 animate-fade-in" key={animationKey}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoices</h3>
              <Button size="sm" className="animate-pulse bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-1" /> New Invoice
              </Button>
            </div>
            
            {/* Invoice Form */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border-2 border-accent animate-scale-in">
              <p className="text-sm font-medium mb-3 text-accent">Create Invoice</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-white dark:bg-slate-700 rounded-lg border flex items-center px-3">
                    <span className="text-sm">John Kamau</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-white dark:bg-slate-700 rounded-lg border flex items-center px-3">
                    <span className="text-sm font-semibold text-accent animate-typing">Ksh 15,000</span>
                  </div>
                  <div className="flex-1 h-10 bg-white dark:bg-slate-700 rounded-lg border flex items-center px-3 gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Jan 5, 2026</span>
                  </div>
                </div>
                <div className="h-10 bg-white dark:bg-slate-700 rounded-lg border flex items-center px-3">
                  <span className="text-sm">January Rent - Room 5A</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Track Overdue
        return (
          <div className="p-6 space-y-4 animate-fade-in" key={animationKey}>
            <h3 className="text-lg font-semibold">Dashboard Overview</h3>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-accent/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-accent">12</p>
                <p className="text-xs text-muted-foreground">Customers</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-3 text-center animate-pulse border-2 border-red-500">
                <p className="text-xl font-bold text-red-500">3</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-500">Ksh 45k</p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
            </div>

            {/* Overdue List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Overdue Payments
              </p>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900 animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-600">JK</div>
                  <div>
                    <p className="text-sm font-medium">John Kamau</p>
                    <p className="text-xs text-red-500">5 days overdue</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-red-500">Ksh 15,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-600">PO</div>
                  <div>
                    <p className="text-sm font-medium">Peter Omondi</p>
                    <p className="text-xs text-red-500">2 days overdue</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-red-500">Ksh 8,500</span>
              </div>
            </div>
          </div>
        );

      case 4: // WhatsApp Reminder
        return (
          <div className="p-6 space-y-4 animate-fade-in" key={animationKey}>
            <h3 className="text-lg font-semibold">Send Reminder</h3>
            
            {/* Customer Card */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">JK</div>
                <div>
                  <p className="font-medium">John Kamau</p>
                  <p className="text-xs text-red-500">Owes Ksh 15,000</p>
                </div>
              </div>
              <Button size="sm" className="bg-[#25D366] hover:bg-[#25D366]/90 animate-pulse">
                <MessageCircle className="w-4 h-4 mr-1" /> Send
              </Button>
            </div>

            {/* WhatsApp Message Preview */}
            <div className="bg-[#DCF8C6] dark:bg-[#025C4C] rounded-xl p-4 animate-scale-in">
              <p className="text-sm text-slate-800 dark:text-white leading-relaxed">
                Hello John Kamau,<br/><br/>
                This is a friendly reminder that your payment of <strong>Ksh 15,000</strong> for January Rent - Room 5A was due on <strong>Jan 5, 2026</strong>.<br/><br/>
                Please make the payment at your earliest convenience.<br/><br/>
                Thank you,<br/>
                Kilimani Apartments
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
              <span>One-click copy to WhatsApp</span>
            </div>
          </div>
        );

      case 5: // Download PDF
        return (
          <div className="p-6 space-y-4 animate-fade-in" key={animationKey}>
            <h3 className="text-lg font-semibold">Generate Statement</h3>
            
            {/* PDF Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in">
              {/* PDF Header */}
              <div className="bg-slate-100 dark:bg-slate-700 p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium">Statement_JohnKamau.pdf</span>
                </div>
                <Button size="sm" variant="ghost" className="animate-pulse">
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
              
              {/* PDF Content Preview */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">STATEMENT</p>
                    <p className="text-xs text-muted-foreground">Kilimani Apartments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">John Kamau</p>
                    <p className="text-xs text-muted-foreground">Room 5A</p>
                  </div>
                </div>
                
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>January Rent</span>
                    <span className="font-medium">Ksh 15,000</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Amount Due</span>
                    <span className="font-bold">Ksh 15,000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>Professional PDF ready to share</span>
            </div>
          </div>
        );

      case 6: // Auto Reminders
        return (
          <div className="p-6 space-y-4 animate-fade-in" key={animationKey}>
            <h3 className="text-lg font-semibold">Auto Reminders</h3>
            
            <div className="bg-accent/10 rounded-xl p-4 border border-accent/30 animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Automatic Reminders</p>
                  <p className="text-xs text-muted-foreground">Set it and forget it</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-sm">3 days before due</span>
                  </div>
                  <div className="w-10 h-6 bg-accent rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-sm">On due date</span>
                  </div>
                  <div className="w-10 h-6 bg-accent rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Every 3 days if overdue</span>
                  </div>
                  <div className="w-10 h-6 bg-accent rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-accent font-medium">
              <Send className="w-4 h-4" />
              <span>Never manually chase payments again!</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-background rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 min-h-[500px]">
          {/* Left - Info Panel */}
          <div className="bg-gradient-to-br from-accent/20 via-accent/10 to-background p-8 flex flex-col justify-center">
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-accent">Step {currentStep + 1} of {steps.length}</span>
              </div>

              {/* Step Title */}
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
                  {React.createElement(steps[currentStep].icon, { className: "w-7 h-7 text-white" })}
                </div>
                <h2 className="text-2xl font-bold text-foreground">{steps[currentStep].title}</h2>
                <p className="text-muted-foreground">{steps[currentStep].subtitle}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-center gap-1">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToStep(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentStep ? 'bg-accent w-4' : 'bg-slate-300 dark:bg-slate-600 hover:bg-accent/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="gap-1"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="gap-1 bg-accent hover:bg-accent/90"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Link to="/dashboard" onClick={onClose}>
                    <Button size="sm" className="gap-1 bg-accent hover:bg-accent/90">
                      Start Free Trial <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right - Dashboard Preview */}
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
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
            <div className="h-[400px] overflow-hidden">
              {renderDashboardContent()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-typing {
          animation: typing 1.5s steps(20) forwards;
          width: 0;
        }
        .animate-typing-delay {
          animation: typing 1.5s steps(20) 0.5s forwards;
          width: 0;
        }
      `}</style>
    </div>
  );
};

export default HowItWorksDemo;
