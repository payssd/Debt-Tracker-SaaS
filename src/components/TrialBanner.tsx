import React from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrialBanner: React.FC = () => {
  const { subscription, trialDaysLeft, isActive } = useSubscription();
  const navigate = useNavigate();

  // Don't show banner if user has active paid subscription
  if (isActive) return null;

  // Show trial banner for users in trial (with or without subscription record)
  if (trialDaysLeft <= 0) return null;

  const isUrgent = trialDaysLeft <= 2;

  return (
    <Alert 
      className={`rounded-none border-x-0 border-t-0 ${
        isUrgent 
          ? 'bg-destructive/10 border-destructive/30' 
          : 'bg-accent/10 border-accent/30'
      }`}
    >
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
          )}
          <AlertDescription className={isUrgent ? 'text-destructive' : 'text-foreground'}>
            {trialDaysLeft === 1 
              ? 'Your free trial ends tomorrow!' 
              : `${trialDaysLeft} days left in your free trial`}
          </AlertDescription>
        </div>
        <Button 
          size="sm" 
          variant={isUrgent ? 'destructive' : 'default'}
          onClick={() => navigate('/pricing')}
          className="flex-shrink-0"
        >
          Upgrade Now
        </Button>
      </div>
    </Alert>
  );
};

export default TrialBanner;