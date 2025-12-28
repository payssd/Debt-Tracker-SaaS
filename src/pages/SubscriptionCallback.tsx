import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';

const PENDING_REF_KEY = 'pending_payment_reference';

const SubscriptionCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, refreshSubscription } = useSubscription();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Preparing to activate your plan...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const hasAttemptedVerification = useRef(false);

  const reference = useMemo(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) {
      localStorage.setItem(PENDING_REF_KEY, ref);
      return ref;
    }
    return localStorage.getItem(PENDING_REF_KEY);
  }, [searchParams]);

  useEffect(() => {
    const run = async () => {
      // Wait for auth to finish loading before checking user
      if (authLoading) {
        setMessage('Restoring your session...');
        return;
      }

      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found.');
        return;
      }

      // If user is not logged in after auth has loaded, ask them to sign in
      if (!user) {
        setStatus('error');
        setMessage('Please sign in to activate your subscription for this account.');
        return;
      }

      // Prevent duplicate verification attempts
      if (hasAttemptedVerification.current) {
        return;
      }
      hasAttemptedVerification.current = true;

      setStatus('loading');
      setMessage('Verifying your payment and activating your plan...');
      setErrorDetails(null);

      const result = await verifyPayment(reference);
      if (result.success) {
        localStorage.removeItem(PENDING_REF_KEY);
        setStatus('success');
        setMessage('Subscription activated! Redirecting...');
        await refreshSubscription();
        // Redirect immediately after subscription refresh
        navigate('/dashboard', { replace: true });
      } else {
        // Reset the flag so user can retry
        hasAttemptedVerification.current = false;
        setStatus('error');
        setMessage('We could not activate your plan yet. If Paystack shows paid, please tap "Retry".');
        setErrorDetails(result.error || null);
      }
    };

    run();
  }, [reference, user, authLoading, verifyPayment, refreshSubscription, navigate]);

  const handlePrimary = () => {
    if (status === 'success') {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!user) {
      navigate('/auth', {
        state: { from: reference ? `/subscription/callback?reference=${encodeURIComponent(reference)}` : '/pricing' },
        replace: true,
      });
      return;
    }

    // retry
    navigate(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && (!user ? 'Sign in required' : 'Activation Failed')}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
          {errorDetails && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg text-left">
              <p className="text-xs font-mono text-destructive break-all">{errorDetails}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {status !== 'loading' && (
            <Button onClick={handlePrimary} className="w-full">
              {status === 'success'
                ? 'Go to Dashboard'
                : !user
                  ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign in to Activate
                    </span>
                  )
                  : 'Retry'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCallback;
