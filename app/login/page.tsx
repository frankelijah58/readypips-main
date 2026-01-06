'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-context';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirect') || '/signals';

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user && !isRedirecting) {
      // Check if user is an admin
      const isAdmin = (user as any).isAdmin || (user as any).role === 'super_admin' || (user as any).role === 'admin';
      const destination = isAdmin ? '/admin/dashboard' : redirectTo;
      // console.log('✅ User already authenticated, redirecting to:', destination);
      setIsRedirecting(true);
      router.replace(destination);
    }
  }, [user, authLoading, router, redirectTo, isRedirecting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailVerificationError(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Welcome back!');
        
        // Check if user is admin and redirect accordingly
        if (data.user?.isAdmin || data.user?.role === 'super_admin' || data.user?.role === 'admin') {
          // console.log('Admin user detected, redirecting to admin dashboard');
          login(data.token, '/admin/dashboard');
        } else {
          // console.log('Regular user detected, redirecting to:', redirectTo);
          login(data.token, redirectTo);
        }
      } else {
        const errorMessage = data.error || 'Login failed';
        setError(errorMessage);
        
        // Check if it's an email verification error
        if (errorMessage.includes('verify your email address')) {
          setIsEmailVerificationError(true);
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsResendingVerification(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent successfully!');
        setIsEmailVerificationError(false);
        setError('');
      } else {
        toast.error(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signIn('google', {
        callbackUrl: formData.email === 'admin@readypips.com' ? '/admin/dashboard' : redirectTo,
        redirect: true,
      });
      
      if (result?.error) {
        toast.error('Google sign in failed. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('An error occurred during Google sign in.');
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
              ← Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="relative h-10">
            <img 
              src="/logo-light.png" 
              alt="Ready Pips Logo" 
              className="h-10 w-auto dark:hidden"
            />
            <img 
              src="/logo-dark.png" 
              alt="Ready Pips Logo" 
              className="h-10 w-auto hidden dark:block"
            />
          </Link>
        </div>

        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-black dark:text-white">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Sign in to access your trading signals dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black dark:text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="bg-white dark:bg-black border-gray-300 dark:border-gray-600 text-black dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black dark:text-white">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="bg-white dark:bg-black border-gray-300 dark:border-gray-600 text-black dark:text-white"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                  {isEmailVerificationError && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                        Need a new verification email?
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        {isResendingVerification ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Resend Verification Email
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6 mb-6 flex items-center">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-4 text-sm text-gray-600 dark:text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Google Login Button - Placeholder */}
            {/* <Button 
              type="button" 
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800" 
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button> */}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">{`Don't have an account?`}</span>
              <Link href="/register" className="text-green-600 hover:text-green-700 hover:underline">
                Create one
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}