import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Calendar, CreditCard, Clock, Check, Loader2, Receipt, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { SubscriptionHistory } from '@/types';

const Subscription: React.FC = () => {
  const { subscription, plans, isActive, isTrialing, trialDaysLeft, loading } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('subscription_history')
        .select(`
          *,
          plan:subscription_plans(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscription history:', error);
      } else {
        setHistory(data || []);
      }
      setHistoryLoading(false);
    };

    fetchHistory();
  }, [user]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'subscription_activated':
      case 'subscription_created':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'subscription_renewed':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'payment_failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'subscription_canceled':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'trial_started':
        return <Clock className="h-4 w-4 text-accent" />;
      default:
        return <Receipt className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'subscription_activated':
        return 'Subscription Activated';
      case 'subscription_created':
        return 'Subscription Created';
      case 'subscription_renewed':
        return 'Subscription Renewed';
      case 'payment_failed':
        return 'Payment Failed';
      case 'subscription_canceled':
        return 'Subscription Canceled';
      case 'trial_started':
        return 'Trial Started';
      default:
        return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const plan = plans[0]; // Get the first plan for features display
  const trialProgress = ((7 - trialDaysLeft) / 7) * 100;

  const getStatusBadge = () => {
    if (isActive) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
    }
    if (isTrialing || (!subscription && trialDaysLeft > 0)) {
      return <Badge className="bg-accent/10 text-accent border-accent/20">Free Trial</Badge>;
    }
    return <Badge variant="destructive">Expired</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 animate-fade-in max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <Crown className="h-7 w-7 text-primary" />
            Subscription
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your subscription and billing
          </p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Current Plan</CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trial Progress (for trial users) */}
            {(isTrialing || (!subscription && trialDaysLeft > 0)) && (
              <div className="space-y-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <span className="font-medium">Free Trial</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
                  </span>
                </div>
                <Progress value={trialProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Enjoy full access to all features during your trial period.
                </p>
              </div>
            )}

            {/* Active Subscription Details */}
            {isActive && subscription && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{subscription.plan?.name || 'Professional'}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {subscription.billing_interval} billing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Next billing date</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.current_period_end 
                        ? format(new Date(subscription.current_period_end), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Features List */}
            {plan && (
              <div className="space-y-3">
                <h3 className="font-medium">Included Features</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              {!isActive && (
                <Button onClick={() => navigate('/pricing')} className="gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade to Premium
                </Button>
              )}
              {isActive && (
                <Button variant="outline" disabled>
                  Manage on Paystack
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Preview (for non-subscribers) */}
        {!isActive && (
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>
                Get unlimited access to all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                  <h3 className="font-semibold mb-1">Monthly</h3>
                  <p className="text-2xl font-bold">KSH 1,000<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Billed monthly</p>
                </div>
                <div className="p-4 rounded-lg border border-accent bg-accent/5 relative">
                  <Badge className="absolute -top-2 right-2 bg-accent text-accent-foreground">Save 2 months</Badge>
                  <h3 className="font-semibold mb-1">Yearly</h3>
                  <p className="text-2xl font-bold">KSH 10,000<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                  <p className="text-sm text-muted-foreground mt-1">Billed annually</p>
                </div>
              </div>
              <Button className="w-full mt-4" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your subscription and payment events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {history.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-0.5">
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">
                            {getEventLabel(event.event_type)}
                          </p>
                          {event.amount && event.amount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              KSH {event.amount.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{format(new Date(event.created_at), 'MMM dd, yyyy • h:mm a')}</span>
                          {event.billing_interval && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{event.billing_interval}</span>
                            </>
                          )}
                        </div>
                        {event.paystack_reference && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                            Ref: {event.paystack_reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No payment history yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your payment events will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Subscription;