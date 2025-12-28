import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Gift, Loader2, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = authSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const referralCodeParam = searchParams.get('ref') || '';
  const modeParam = searchParams.get('mode') as AuthMode | null;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState(referralCodeParam);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<AuthMode>(modeParam === 'reset' ? 'reset' : 'signin');
  
  const { user, signUp, signIn, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from as string | undefined;

  useEffect(() => {
    if (user && mode !== 'reset') {
      navigate(from || '/dashboard', { replace: true });
    }
  }, [user, navigate, mode, from]);

  useEffect(() => {
    if (modeParam === 'reset') {
      setMode('reset');
    }
  }, [modeParam]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      authSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate(from || '/dashboard', { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      signupSchema.parse({ email, password, name });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    setLoading(true);
    const { error } = await signUp(email, password, name, referralCode || undefined);
    setLoading(false);
    
    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account, or sign in if email confirmation is disabled.',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!email || !z.string().email().safeParse(email).success) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    
    if (error) {
      toast({
        title: 'Request failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link. Click it to reset your password.',
      });
      setMode('signin');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      resetPasswordSchema.parse({ password, confirmPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    
    if (error) {
      toast({
        title: 'Password reset failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password updated!',
        description: 'Your password has been reset successfully.',
      });
      navigate('/dashboard');
    }
  };

  if (mode === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => setMode('signin')}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Debt Tracker</CardTitle>
          <CardDescription>Manage your invoices and track payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={referralCodeParam ? 'signup' : 'signin'}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="w-full text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {referralCode && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    <span className="text-sm">You were referred! Both you and your referrer will get 1 month free.</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-referral">Referral Code (optional)</Label>
                  <Input
                    id="signup-referral"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By signing up, you agree to our{' '}
                  <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
