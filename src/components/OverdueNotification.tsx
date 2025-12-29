import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, Bell, ArrowRight, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOverdueNotification, useAutoUpdateOverdueInvoices } from '@/hooks/useOverdueTracker';
import { cn } from '@/lib/utils';

export default function OverdueNotification() {
  const navigate = useNavigate();
  const { shouldShow, overdueStats, dismissNotification, isLoading } = useOverdueNotification();
  const autoUpdateMutation = useAutoUpdateOverdueInvoices();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false);

  // Auto-update overdue invoices on component mount
  useEffect(() => {
    autoUpdateMutation.mutate();
  }, []);

  useEffect(() => {
    if (shouldShow && !isLoading) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, isLoading]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      dismissNotification();
      setIsVisible(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  const handleSendReminders = () => {
    handleDismiss();
    setTimeout(() => navigate('/reminders'), 100);
  };

  const handleViewInvoices = () => {
    handleDismiss();
    setTimeout(() => navigate('/invoices'), 100);
  };

  if (!shouldShow || !isVisible || !overdueStats) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300",
          isAnimatingOut ? "opacity-0" : "opacity-100"
        )}
        onClick={handleDismiss}
      />
      
      {/* Notification Modal */}
      <div 
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4",
          "transition-all duration-300",
          isAnimatingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
      >
        <div className="relative rounded-2xl bg-card border border-red-500/20 shadow-2xl overflow-hidden">
          {/* Red gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent opacity-50" />
          
          {/* Animated warning stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="relative p-6 pt-8">
            <div className="flex flex-col items-center text-center">
              {/* Icon with animation */}
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg animate-pulse">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center border-2 border-card">
                  <Bell className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                ⚠️ Overdue Invoices Alert!
              </h3>
              
              <p className="text-muted-foreground mb-4">
                You have <span className="font-bold text-red-500">{overdueStats.count}</span> overdue 
                {overdueStats.count === 1 ? ' invoice' : ' invoices'} totaling{' '}
                <span className="font-bold text-red-500">{formatCurrency(overdueStats.totalAmount)}</span>
              </p>

              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">{overdueStats.count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-orange-500" />
                    <span className="text-lg font-bold text-orange-500">{formatCurrency(overdueStats.totalAmount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </div>
              </div>

              {/* Top overdue invoices preview */}
              {overdueStats.invoices.length > 0 && (
                <div className="w-full mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Most overdue:</p>
                  {overdueStats.invoices.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate max-w-[150px]">{inv.customer_name}</span>
                      <span className="text-red-500 font-medium">{inv.days_overdue}d overdue</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-4">
                💡 Send reminders now so your customers don't forget to pay!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  onClick={handleSendReminders} 
                  className="flex-1 gap-2 bg-red-500 hover:bg-red-600"
                >
                  Send Reminders
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleViewInvoices}
                  className="flex-1"
                >
                  View Invoices
                </Button>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50">
              <button 
                onClick={handleDismiss}
                className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                Remind me later today
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
