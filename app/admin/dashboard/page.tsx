'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import AdminSidebar from './components/admin-sidebar';
import DashboardOverview from './components/dashboard-overview';
import UserManagement from './components/user-management';
import SubscriptionManagement from './components/subscription-management';
import PartnersManagement from './components/partners-management';
import SupportManagement from './components/support-management';

type AdminSection = 'dashboard' | 'users' | 'subscriptions' | 'partners' | 'support';

/** Typing `/users` + Enter (or bare `users`) switches sections; those strings are not used as table filters on Overview. */
const NAV_TO_SECTION: Record<string, AdminSection> = {
  '/dashboard': 'dashboard',
  '/users': 'users',
  '/subscriptions': 'subscriptions',
  '/partners': 'partners',
  '/support': 'support',
  dashboard: 'dashboard',
  users: 'users',
  user: 'users',
  subscriptions: 'subscriptions',
  subs: 'subscriptions',
  partners: 'partners',
  partner: 'partners',
  support: 'support',
};

function tryParseNavSection(query: string): AdminSection | null {
  const t = query.trim().toLowerCase();
  return NAV_TO_SECTION[t] ?? null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [headerSearch, setHeaderSearch] = useState('');
  const headerSearchRef = useRef<HTMLInputElement>(null);

  const focusHeaderSearch = useCallback(() => {
    headerSearchRef.current?.focus();
    headerSearchRef.current?.select();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
        return;
      }
      if (target.closest('[role="combobox"]') || target.closest('[data-radix-select-trigger]')) {
        return;
      }
      e.preventDefault();
      focusHeaderSearch();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusHeaderSearch]);

  const fetchAdminProfile = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      const data = await response.json();
      
      if (!data.user.isAdmin && !data.user.role) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin dashboard',
          variant: 'destructive',
        });
        router.push('/signals');
        return;
      }
      setAdmin(data.user);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAdminProfile(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    await signOut({ redirect: false });
    toast({ title: 'Logged out', description: 'You have been logged out successfully' });
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#8C57FF] border-t-transparent mx-auto"></div>
          <p className="text-white/60 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboardTableFilter =
    currentSection === 'dashboard' && tryParseNavSection(headerSearch) !== null
      ? ''
      : headerSearch;

  if (!admin) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <p className="mb-2 text-xl font-semibold text-white">Access Denied</p>
          <p className="text-white/50">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] font-sans">
      {/* Sidebar */}
      <AdminSidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        admin={admin}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Navbar (Materio style) */}
        <div className="sticky top-0 z-10 bg-[#18181b]/80 backdrop-blur-md border-b border-white/[0.04]">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {getSectionTitle(currentSection)}
              </h1>
              <p className="text-[11px] text-white/30 font-medium tracking-wide uppercase mt-0.5">
                Admin Area / {getSectionTitle(currentSection)}
              </p>
            </div>
            <div className="flex items-center gap-6">
              {/* Search bar */}
              <div className="hidden md:flex items-center gap-2 bg-[#18181b]/5 rounded-md px-3 py-2 border border-white/10 focus-within:border-[#8C57FF] focus-within:bg-[#18181b]/10 transition-all w-64">
                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={headerSearchRef}
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Search or jump to a section"
                  placeholder="Search…  /users + Enter"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const nav = tryParseNavSection(headerSearch);
                      if (nav) {
                        e.preventDefault();
                        setCurrentSection(nav);
                        setHeaderSearch('');
                        toast({
                          title: 'Section',
                          description: `Switched to ${getSectionTitle(nav)}`,
                        });
                      }
                    }
                    if (e.key === 'Escape') {
                      setHeaderSearch('');
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/30"
                />
              </div>
              
              {/* Profile Details Dropdown */}
              <div className="relative border-l border-white/10 pl-6">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => {
                    const el = document.getElementById('profile-dropdown');
                    if (el) el.classList.toggle('hidden');
                  }}
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-white text-sm font-semibold leading-tight group-hover:text-[#8C57FF] transition-colors">{admin?.firstName || 'Admin'}</p>
                    <p className="text-white/40 text-[11px] font-medium tracking-wider uppercase">
                      {admin?.isAdmin ? 'Administrator' : 'Moderator'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#8C57FF] flex items-center justify-center text-white font-bold text-base flex-shrink-0 ring-2 ring-[#8C57FF]/30 group-hover:ring-[#8C57FF]/60 transition-all shadow-lg">
                    {admin?.firstName?.charAt(0) || 'A'}
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div id="profile-dropdown" className="hidden absolute right-0 top-full mt-3 w-56 bg-[#18181b] rounded-lg shadow-xl shadow-black/40 border border-white/10 overflow-hidden transform origin-top-right transition-all">
                  <div className="px-4 py-3 border-b border-white/5 bg-[#18181b]/[0.02]">
                    <p className="text-sm font-semibold text-white">{admin?.firstName} {admin?.lastName}</p>
                    <p className="text-xs text-white/50 truncate max-w-full">{admin?.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-[#18181b]/5 hover:text-white transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-[#18181b]/5 hover:text-white transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Account Settings
                    </button>
                    <div className="my-1 border-t border-white/5"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-[#FF4C51] hover:bg-[#FF4C51]/10 transition-colors flex items-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {currentSection === 'dashboard' && (
            <DashboardOverview admin={admin} headerSearch={dashboardTableFilter} />
          )}
          {currentSection === 'users' && (
            <UserManagement
              admin={admin}
              headerSearch={headerSearch}
              onHeaderSearchChange={setHeaderSearch}
            />
          )}
          {currentSection === 'subscriptions' && (
            <SubscriptionManagement
              admin={admin}
              headerSearch={headerSearch}
              onHeaderSearchChange={setHeaderSearch}
            />
          )}
          {currentSection === 'partners' && (
            <PartnersManagement
              admin={admin}
              headerSearch={headerSearch}
              onHeaderSearchChange={setHeaderSearch}
            />
          )}
          {currentSection === 'support' && <SupportManagement admin={admin} />}
        </div>
      </main>
    </div>
  );
}

function getSectionTitle(section: AdminSection): string {
  const titles: { [key in AdminSection]: string } = {
    dashboard: 'Dashboard Overview',
    users: 'User Management',
    subscriptions: 'Subscription Management',
    partners: 'Partners Management',
    support: 'Support Requests',
  };
  return titles[section];
}

