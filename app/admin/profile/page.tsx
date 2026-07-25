'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, User } from 'lucide-react';

type AdminRow = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  isAdmin?: boolean;
};

export default function AdminProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState<AdminRow | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

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
        if (!profileRes.ok) {
          setAdmin({
            _id: user._id,
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role,
            isAdmin: user.isAdmin,
          });
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
        } else {
          const data = await profileRes.json();
          const a = data.admin as AdminRow;
          setAdmin(a);
          setFirstName(a.firstName || '');
          setLastName(a.lastName || '');
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Could not load profile',
          variant: 'destructive',
        });
        router.replace('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }
      toast({ title: 'Saved', description: 'Your profile was updated.' });
      if (data.admin) {
        setAdmin(data.admin);
      }
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
            <p className="mt-1 text-sm text-white/50">
              Your name as shown in the admin area. Email is managed separately.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-xl border border-white/10 bg-[#18181b] p-6 shadow-xl shadow-black/40"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40">
                Email
              </label>
              <p className="rounded-lg border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-white/80">
                {admin?.email || '—'}
              </p>
            </div>
            <div>
              <label
                htmlFor="admin-first-name"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40"
              >
                First name
              </label>
              <input
                id="admin-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2 text-sm outline-none focus:border-[#8C57FF]/60 focus:ring-1 focus:ring-[#8C57FF]/40"
              />
            </div>
            <div>
              <label
                htmlFor="admin-last-name"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/40"
              >
                Last name
              </label>
              <input
                id="admin-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2 text-sm outline-none focus:border-[#8C57FF]/60 focus:ring-1 focus:ring-[#8C57FF]/40"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-[#8C57FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#7a4ae0] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </button>
            <Link
              href="/admin/account-settings"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              Account settings
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
