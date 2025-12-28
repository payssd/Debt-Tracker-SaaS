import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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
        <div className="mx-auto max-w-3xl prose prose-slate dark:prose-invert">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
            By accessing and using Debt Tracker, you accept and agree to be bound by the terms and 
              provisions of this agreement. If you do not agree to these terms, please do not 
              use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
            Debt Tracker provides a debt tracking and invoice management platform that helps 
              suppliers track unpaid invoices, generate statements, and send payment reminders. 
              We reserve the right to modify or discontinue the service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use Debt Tracker, you must:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Subscription and Payments</h2>
            <p className="text-muted-foreground">
              Debt Tracker offers a 7-day free trial. After the trial period, you may choose a paid 
              subscription plan. Subscriptions are billed in advance on a monthly or annual basis. 
              You can cancel your subscription at any time, and you will retain access until the 
              end of your billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. User Conduct</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the service</li>
              <li>Upload malicious code or harmful content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Ownership</h2>
            <p className="text-muted-foreground">
              You retain all rights to the data you input into Debt Tracker. We do not claim 
              ownership of your customer data, invoices, or any other business information. 
              You may export or delete your data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Debt Tracker shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of or inability to use the service. 
              Our total liability shall not exceed the amount paid by you in the twelve months 
              preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@debtflow.app" className="text-accent hover:underline">
                legal@debtflow.app
              </a>
            </p>
          </section>
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

export default TermsOfService;