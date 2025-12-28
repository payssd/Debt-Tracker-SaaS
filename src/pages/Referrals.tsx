import { useState } from 'react';
import { Copy, Gift, Users, Check, Share2, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProfile, useReferrals, getReferralLink } from '@/hooks/useReferralData';
import { format } from 'date-fns';

export default function Referrals() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: referrals = [], isLoading: referralsLoading } = useReferrals();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const referralLink = profile ? getReferralLink(profile.referral_code) : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Debt Tracker',
          text: 'Sign up for Debt Tracker using my referral link and we both get 1 month free!',
          url: referralLink,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyToClipboard();
    }
  };

  if (profileLoading || referralsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load profile</p>
        </div>
      </Layout>
    );
  }

  const subscriptionEndDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : new Date();
  const daysRemaining = Math.max(0, Math.ceil((subscriptionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-24 md:pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Referral Program</h1>
          <p className="text-muted-foreground mt-1">
            Invite friends and earn free subscription time
          </p>
        </div>

        {/* Hero Card */}
        <Card className="gradient-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Gift className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1">Invite a friend. You both get 1 month free!</h2>
                <p className="text-primary-foreground/80 text-sm">
                  Share your unique referral code with friends. When they sign up, you both get an extra month of subscription time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.referral_count}</p>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.referral_count * 30}</p>
                  <p className="text-xs text-muted-foreground">Days Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{daysRemaining}</p>
                  <p className="text-xs text-muted-foreground">Days Left</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Badge variant="outline" className="text-xs px-2">
                    {profile.subscription_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.subscription_end_date 
                      ? `Until ${format(new Date(profile.subscription_end_date), 'MMM d, yyyy')}`
                      : 'No expiry set'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code & Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Referral Code</CardTitle>
            <CardDescription>Share this code or link with friends to earn rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code */}
            <div className="flex items-center justify-center p-6 bg-muted rounded-xl">
              <span className="text-3xl md:text-4xl font-mono font-bold tracking-widest text-primary">
                {profile.referral_code}
              </span>
            </div>

            {/* Referral Link */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center bg-muted rounded-lg px-4 py-3 overflow-hidden">
                <span className="text-sm text-muted-foreground truncate">{referralLink}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  onClick={copyToClipboard}
                  className="flex-1 sm:flex-none"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button onClick={shareLink} className="flex-1 sm:flex-none">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invited Friends</CardTitle>
            <CardDescription>
              {referrals.length === 0 
                ? "No referrals yet. Share your code to get started!" 
                : `You've invited ${referrals.length} friend${referrals.length !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Share your referral link to see your invited friends here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(referral.referred_profile?.name || referral.referred_profile?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{referral.referred_profile?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{referral.referred_profile?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={referral.status === 'Completed' ? 'default' : 'secondary'}>
                        {referral.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <h3 className="font-medium mb-1">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">Copy and share your unique referral link with friends</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <h3 className="font-medium mb-1">Friend Signs Up</h3>
                <p className="text-sm text-muted-foreground">Your friend creates an account using your code</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <h3 className="font-medium mb-1">Both Get Rewarded</h3>
                <p className="text-sm text-muted-foreground">You both receive 1 month of free subscription</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
