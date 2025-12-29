import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2, Shield, Lock, Sparkles } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AdminLogo = () => (
  <div className="flex flex-col items-center justify-center gap-3 mb-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center shadow-2xl border border-slate-600">
        <Shield className="w-8 h-8 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center animate-pulse">
        <Lock className="w-3 h-3 text-white" />
      </div>
    </div>
    <div className="text-center">
      <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
      <p className="text-sm text-slate-400">Debt Tracker Administration</p>
    </div>
  </div>
);

const AdminAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      if (user) {
        setCheckingAdmin(true);
        try {
          const { data, error } = await supabase.rpc('is_admin', { p_user_id: user.id });
          if (!error && data === true) {
            navigate('/admin', { replace: true });
          }
        } catch (err) {
          console.error('Admin check failed:', err);
        }
        setCheckingAdmin(false);
      }
    };
    checkAdminAndRedirect();
  }, [user, navigate]);

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
    
    // First sign in
    const { data: authData, error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setLoading(false);
      toast({
        title: 'Sign in failed',
        description: signInError.message,
        variant: 'destructive',
      });
      return;
    }

    // Check if user is admin
    try {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { 
        p_user_id: authData?.user?.id 
      });

      if (adminError) {
        throw adminError;
      }

      if (!isAdmin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        setLoading(false);
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges. Please use the regular login page.',
          variant: 'destructive',
        });
        return;
      }

      // User is admin, redirect to admin dashboard
      toast({
        title: 'Welcome, Admin!',
        description: 'You have successfully signed in to the admin portal.',
      });
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setLoading(false);
      toast({
        title: 'Admin verification failed',
        description: err.message || 'Could not verify admin status. Please try again.',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/3 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      <Card className="w-full max-w-md relative z-10 bg-slate-800/80 backdrop-blur-xl border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <AdminLogo />
          <CardDescription className="text-slate-400">
            Sign in with your admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-slate-300">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
              />
              {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-white font-semibold py-5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In to Admin Portal
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              This portal is restricted to authorized administrators only.
              <br />
              Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Floating badges */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-500 text-xs">
        <Lock className="w-3 h-3" />
        <span>Secure Admin Access</span>
        <span className="mx-2">•</span>
        <Sparkles className="w-3 h-3" />
        <span>Debt Tracker Platform</span>
      </div>
    </div>
  );
};

export default AdminAuth;
