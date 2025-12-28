import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const PaymentCallbackHandler: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, refreshSubscription } = useSubscription();
  const { user } = useAuth();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const isPaymentCallback = searchParams.get('payment') === 'callback';
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (isPaymentCallback && reference && user) {
      setIsOpen(true);
      setStatus('loading');
      setMessage('Verifying your payment...');

      const verify = async () => {
        try {
          const success = await verifyPayment(reference);

          if (success) {
            setStatus('success');
            setMessage('Payment successful! Your plan is now active. Redirecting to dashboard...');
            await refreshSubscription();
            
            // Clear URL params
            setSearchParams({});
            
            // Redirect after short delay
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          } else {
            setStatus('error');
            setMessage('Payment verification failed. Please contact support if payment was deducted.');
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          setStatus('error');
          setMessage('An error occurred during verification. Please contact support.');
        }
      };

      verify();
    }
  }, [searchParams, user, verifyPayment, refreshSubscription, navigate, setSearchParams]);

  const handleClose = () => {
    setIsOpen(false);
    setSearchParams({});
    if (status === 'success') {
      navigate('/dashboard');
    }
  };

  if (status === 'idle') return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
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
          <DialogTitle className="text-center">
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        {status !== 'loading' && (
          <div className="flex justify-center mt-4">
            <Button onClick={handleClose}>
              {status === 'success' ? 'Go to Dashboard' : 'Close'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCallbackHandler;
