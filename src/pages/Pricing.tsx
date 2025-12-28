import React, { useState } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';

const Pricing: React.FC = () => {
  const { plans, subscription, isActive, initializePayment, loading } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const isExpired = location.state?.expired;

  // Get the first plan (Professional) for both monthly and yearly
  const plan = plans[0];

  const handleSubscribe = async (billingInterval: 'monthly' | 'yearly') => {
    if (!plan) return;

    if (!user) {
      navigate('/auth', { state: { from: '/pricing', planId: plan.id, billingInterval } });
      return;
    }

    setLoadingPlan(billingInterval);

    try {
      const result = await initializePayment(plan.id, billingInterval);

      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }

      console.error('Paystack initialize failed:', result.error);
      const message = result.error?.message || 'Unknown error';
      toast.error(`Failed to initialize payment: ${message}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCurrentMonthly = subscription?.plan_id === plan?.id && subscription?.billing_interval === 'monthly' && isActive;
  const isCurrentYearly = subscription?.plan_id === plan?.id && subscription?.billing_interval === 'yearly' && isActive;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {isExpired && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-destructive font-medium">
                Your free trial has ended. Choose a plan to continue using the platform.
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 7-day free trial. No credit card required. 
            Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Monthly Plan */}
          <Card className="border-border bg-card hover:shadow-lg transition-all duration-300 h-full">
            <CardContent className="pt-8 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Monthly</h3>
              <div className="text-4xl font-bold text-foreground mb-2">
                KSH 1,000<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">Perfect for small suppliers</p>
              
              {plan && (
                <ul className="space-y-3 text-left mb-6">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              <Button 
                className="w-full" 
                variant="outline"
                size="lg"
                disabled={isCurrentMonthly || loadingPlan === 'monthly'}
                onClick={() => handleSubscribe('monthly')}
              >
                {loadingPlan === 'monthly' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentMonthly ? (
                  'Current Plan'
                ) : (
                  'Get Started'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Yearly Plan */}
          <Card className="border-accent bg-card relative overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
              SAVE 2 MONTHS
            </div>
            <CardContent className="pt-8 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">Yearly</h3>
              <div className="text-4xl font-bold text-foreground mb-2">
                KSH 10,000<span className="text-lg font-normal text-muted-foreground">/year</span>
              </div>
              <p className="text-muted-foreground mb-6">Save 2 months</p>
              
              {plan && (
                <ul className="space-y-3 text-left mb-6">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              <Button 
                className="w-full"
                size="lg"
                disabled={isCurrentYearly || loadingPlan === 'yearly'}
                onClick={() => handleSubscribe('yearly')}
              >
                {loadingPlan === 'yearly' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentYearly ? (
                  'Current Plan'
                ) : (
                  'Get Started'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trial info */}
        <p className="text-center mt-8 text-accent font-medium">
          ✨ Free 7-day trial — start without risk
        </p>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing;