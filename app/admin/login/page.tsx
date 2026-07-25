'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/components/auth-context";

export default function AdminLogin() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Redirect to main login page
    // Admin users (admin@readypips.com) will be automatically redirected to admin dashboard
    if (!authLoading && (!user || (user && !user.isAdmin && !user.role))) {
      router.push('/login');
    }else if (!authLoading && user && (user.isAdmin || user.role)) {
      router.push('/admin/dashboard');
    }
    
  }, [router, authLoading, user]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  );
}
