import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { hasAccess, loading: subscriptionLoading, isTrialing, trialDaysLeft } = useSubscription();
  const { loading: authLoading, user } = useAuth();
  const location = useLocation();

  // Allow access to pricing and callback pages without subscription
  const allowedPaths = ['/pricing', '/subscription/callback', '/auth'];
  if (allowedPaths.some(path => location.pathname.startsWith(path))) {
    return <>{children}</>;
  }

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/pricing" state={{ from: location, expired: true }} replace />;
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
