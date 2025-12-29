import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Users, Clock, BarChart3, Star, AlertCircle, Bell, AlertTriangle, TrendingUp, Gift, Heart, RefreshCw, ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFunnelNotification, useDismissFunnelNotification, useLogNotificationView, useLogNotificationClick } from '@/hooks/useFunnelNotification';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<any>> = {
  sparkles: Sparkles, users: Users, clock: Clock, chart: BarChart3, star: Star,
  alert: AlertCircle, bell: Bell, warning: AlertTriangle, trending: TrendingUp,
  gift: Gift, heart: Heart, refresh: RefreshCw,
};

const phaseColors: Record<string, { bg: string; border: string; icon: string; button: string }> = {
  trial: { bg: 'from-primary/10 via-primary/5 to-transparent', border: 'border-primary/20', icon: 'bg-primary text-white', button: 'bg-primary hover:bg-primary/90' },
  conversion: { bg: 'from-orange-500/10 via-orange-500/5 to-transparent', border: 'border-orange-500/20', icon: 'bg-orange-500 text-white', button: 'bg-orange-500 hover:bg-orange-600' },
  recovery: { bg: 'from-red-500/10 via-red-500/5 to-transparent', border: 'border-red-500/20', icon: 'bg-red-500 text-white', button: 'bg-red-500 hover:bg-red-600' },
};

export default function FunnelNotification() {
  const navigate = useNavigate();
  const { data: notification, isLoading } = useFunnelNotification();
  const dismissMutation = useDismissFunnelNotification();
  const logViewMutation = useLogNotificationView();
  const logClickMutation = useLogNotificationClick();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (notification && !isLoading) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        logViewMutation.mutate(notification.day_number);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [notification, isLoading]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      dismissMutation.mutate();
      setIsVisible(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  const handleCtaClick = () => {
    if (notification) {
      logClickMutation.mutate({ dayNumber: notification.day_number, ctaUrl: notification.cta_url });
      handleDismiss();
      setTimeout(() => navigate(notification.cta_url), 100);
    }
  };

  if (!notification || !isVisible) return null;

  const IconComponent = iconMap[notification.icon] || Rocket;
  const colors = phaseColors[notification.phase] || phaseColors.trial;

  return (
    <>
      <div className={cn("fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300", isAnimatingOut ? "opacity-0" : "opacity-100")} onClick={handleDismiss} />
      <div className={cn("fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4 transition-all duration-300", isAnimatingOut ? "opacity-0 scale-95" : "opacity-100 scale-100")}>
        <div className={cn("relative rounded-2xl bg-card border shadow-2xl overflow-hidden", colors.border)}>
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", colors.bg)} />
          <button onClick={handleDismiss} className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10">
            <X className="h-4 w-4" />
          </button>
          <div className="relative p-6 pt-8">
            <div className="absolute top-4 left-4">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Day {notification.day_number} • {notification.phase.charAt(0).toUpperCase() + notification.phase.slice(1)}
              </span>
            </div>
            <div className="flex flex-col items-center text-center mt-4">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg", colors.icon)}>
                <IconComponent className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{notification.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{notification.message}</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button onClick={handleCtaClick} className={cn("flex-1 gap-2", colors.button)}>
                  {notification.cta_text}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleDismiss} className="flex-1">
                  Maybe Later
                </Button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground">
                {notification.phase === 'trial' ? `${7 - notification.day_number} days left in your free trial` : 'Reactivate to continue using all features'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
