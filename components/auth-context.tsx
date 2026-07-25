'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';


export type UserRole = "user" | "affiliate" | "partner" | "admin";

export interface AffiliateProfile {
  referralCode: string;
  commissionRate: number; // e.g. 0.1 = 10%
  totalEarnings: number;
  totalReferrals: number;
  isActive: boolean;
}

export interface PartnerProfile {
  companyName: string;
  tier: "silver" | "gold" | "platinum";
  revenueShare: number; // %
  managedAffiliates: number;
  totalRevenue: number;
  isApproved: boolean;
}


export interface User {
  _id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;

    /** 🔑 ROLE */
  role: UserRole;
  isAdmin?: boolean;

  /** 🧩 PROFILES (OPTIONAL) */
  affiliateProfile?: AffiliateProfile | null;
  partnerProfile?: PartnerProfile | null;

  subscriptionStatus: "active" | "inactive" | "expired";
  subscriptionType: "free" | "basic" | "premium" | "pro" | null;
  subscriptionEndDate?: Date;
  subscriptionStartDate?: Date;
  freeTrialEndDate?: Date; // 3-day free trial for new users
  // Pending subscription (scheduled to activate after current expires)
  pendingSubscription?: {
    type: "basic" | "premium" | "pro";
    planId: string;
    planName: string;
    duration: number; // days
    scheduledStartDate: Date; // When current subscription ends
  } | null;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  provider?: "credentials" | "google";
  googleId?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// interface User {
//   _id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   phoneNumber?: string;
//   phone?: string;
//   subscriptionStatus: 'active' | 'inactive' | 'expired';
//   subscriptionType: 'basic' | 'premium' | 'pro' | 'free' | null;
//   subscriptionEndDate?: Date;
//   subscriptionStartDate?: Date;
//   freeTrialEndDate?: Date;
//   emailVerified?: boolean;
//   createdAt?: Date;
//   image?: string;
//   isAdmin?: boolean;
//   role?: string;
// }

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, redirectUrl?: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  const checkAuth = async () => {
    try {
      // console.log('🔐 Checking authentication...');
      
      // Check NextAuth session first
      if (session?.user) {
        // console.log('✅ NextAuth session found:', session.user);
        setUser({
          _id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          phoneNumber: (session.user as any).phoneNumber,
          phone: (session.user as any).phone,
          subscriptionStatus: session.user.subscriptionStatus as any,
          subscriptionType: session.user.subscriptionType as any,
          subscriptionEndDate: (session.user as any).subscriptionEndDate,
          subscriptionStartDate: (session.user as any).subscriptionStartDate,
          freeTrialEndDate: (session.user as any).freeTrialEndDate,
          emailVerified: (session.user as any).emailVerified,
          createdAt: (session.user as any).createdAt,
          image: session.user.image,
          isAdmin: (session.user as any).isAdmin,
          role: (session.user as any).role,
        } as any);
        
        // Store the app token for API calls
        if (session.appToken) {
          localStorage.setItem('token', session.appToken);
        }
        
        setLoading(false);
        return;
      }
      
      // Fall back to regular token check
      const token = localStorage.getItem('token');
      if (!token) {
        // console.log('❌ No token found in localStorage');
        setLoading(false);
        return;
      }

      // console.log('📡 Making auth verification request...');
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // console.log('🔑 Auth response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log('✅ Auth successful, user data:', data.user);
        setUser(data.user);
      } else {
        // console.log('❌ Auth failed, status:', response.status);
        // Only remove token if it's actually invalid (401), not on network errors
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('returnUrl');
        }
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Don't remove token on network errors - keep it for retry
      // Only remove on actual auth failures (handled in response.status check above)
    } finally {
      // console.log('🏁 Setting auth loading to false');
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    // console.log('🔄 Refreshing user data...');
    await checkAuth();
  };

  const login = (token: string, redirectUrl?: string) => {
    localStorage.setItem('token', token);
    
    // Use provided redirect URL, or get return URL, or default to signals page
    const destination = redirectUrl || localStorage.getItem('returnUrl') || '/signals';
    localStorage.removeItem('returnUrl');
    
    // Redirect to the appropriate page (auth will be checked on page load)
    window.location.href = destination;
  };

  const logout = async () => {
    // Clear all localStorage items related to auth
    localStorage.removeItem('token');
    localStorage.removeItem('returnUrl');
    
    // Sign out from NextAuth session
    await signOut({ redirect: false });
    
    // Clear user state
    setUser(null);
    
    // Clear any browser cache for auth endpoints
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  };

  useEffect(() => {
    // If session status changes, re-check auth
    if (status !== 'loading') {
      checkAuth();
    }
  }, [session, status]);

  useEffect(() => {
    // Check auth on mount
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 