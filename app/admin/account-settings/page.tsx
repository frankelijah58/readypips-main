'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, Loader2, User } from 'lucide-react';

type AdminProfile = {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  lastLogin?: string;
  createdAt?: string;
};

export default function AdminAccountSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const verifyRes = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!verifyRes.ok) {
          localStorage.removeItem('token');
          router.replace('/login');
          return;
        }
        const { user } = await verifyRes.json();
        const role = String(user.role || '');
        const isAdminAccess =
          user.isAdmin === true ||
          role === 'admin' ||
          role === 'super_admin' ||
          role === 'moderator';
        if (!isAdminAccess) {
          router.replace('/signals');
          return;
        }

        const profileRes = await fetch('/api/admin/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          const a = data.admin as AdminProfile;
          setProfile({
            email: a.email,
            firstName: a.firstName,
            lastName: a.lastName,
            role: a.role,
            lastLogin: a.lastLogin,
            createdAt: a.createdAt,
          });
        } else {
          setProfile({
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role,
          });
        }
      } catch {
        router.replace('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not update password');
      }
      toast({ title: 'Password updated', description: 'Use your new password next time you sign in.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8C57FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <div className="border-b border-white/[0.06] bg-[#18181b]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8C57FF]/20 text-[#8C57FF]">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
            <p className="mt-1 text-sm text-white/50">
              Change your password. If you use Google sign-in only, password change may not apply.
            </p>
          </div>
        </div>

        {profile && (
          <div className="mb-8 flex gap-4 rounded-xl border border-white/10 bg-[#18181b] p-5 shadow-lg shadow-black/30">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#8C57FF]">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1 text-sm">
              <p className="font-medium text-white">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="truncate text-white/60">{profile.email}</p>
              {profile.role && (
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Role: {String(profile.role).replace(/_/g, ' ')}
                </p>
              )}
              {profile.lastLogin && (
                <p className="text-xs text-white/35">
                  Last sign-in:{' '}
                  {new Date(profile.lastLogin).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        <form
          onSubmit={handlePasswordChange}
          className="rounded-xl border border-white/10 bg-[#18181b] p-6 shadow-xl shadow-black/40"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="current-pw"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40"
              >
                Current password
              </label>
              <input
                id="current-pw"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2 text-sm outline-none focus:border-[#8C57FF]/60 focus:ring-1 focus:ring-[#8C57FF]/40"
              />
            </div>
            <div>
              <label
                htmlFor="new-pw"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40"
              >
                New password
              </label>
              <input
                id="new-pw"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2 text-sm outline-none focus:border-[#8C57FF]/60 focus:ring-1 focus:ring-[#8C57FF]/40"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-pw"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40"
              >
                Confirm new password
              </label>
              <input
                id="confirm-pw"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2 text-sm outline-none focus:border-[#8C57FF]/60 focus:ring-1 focus:ring-[#8C57FF]/40"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#8C57FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#7a4ae0] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
            </button>
            <Link
              href="/admin/profile"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              My profile
            </Link>
          </div>

          <p className="mt-8 border-t border-white/10 pt-6 text-sm text-white/45">
            Forgot your password?{' '}
            <Link href="/admin/forgot-password" className="text-[#8C57FF] hover:underline">
              Request a reset link
            </Link>
            .
          </p>
        </form>
      </main>
    </div>
  );
}
