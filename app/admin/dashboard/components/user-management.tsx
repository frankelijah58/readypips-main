'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Pencil, ShieldCheck, Trash2, Loader2 } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  subscriptionType?: 'free' | 'basic' | 'premium' | 'pro' | null;
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
  emailVerified?: boolean;
  createdAt: string;
  freeTrialEndDate?: string;
  subscriptionEndDate?: string;
  isAdmin?: boolean;
  role?: string;
}

export default function UserManagement({
  admin,
  headerSearch,
  onHeaderSearchChange,
}: {
  admin: any;
  headerSearch: string;
  onHeaderSearchChange: (value: string) => void;
}) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({ 
    // total: 0, 
    // free: 0, 
    // weekly: 0, 
    // monthly: 0, 
    // threeMonths: 0 

    totalUsers: 1,
    active: 1,
    expired: 0,
    trial: 0,
    pending: 0,
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<'make-admin' | 'delete' | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, headerSearch, limit]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

    // if (statsRes.ok) {
    //   const { stats } = await statsRes.json();
    //   setStats(stats);
    // }

      if (!res.ok) throw new Error();

      const data = await res.json();
      setStats(data.stats);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load user statistics",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchUsers = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: headerSearch,
    });

    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error();

    const data = await res.json();
    setUsers(data.users);
    setTotalPages(data.totalPages);

  } catch {
    toast({
      title: "Error",
      description: "Failed to load users",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};


  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editingUser.firstName?.trim() || !editingUser.lastName?.trim()) {
      toast({
        title: 'Missing name',
        description: 'First and last name are required.',
        variant: 'destructive',
      });
      return;
    }
    if (!editingUser.email?.trim()) {
      toast({
        title: 'Missing email',
        description: 'Email is required.',
        variant: 'destructive',
      });
      return;
    }

    setSavingUser(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          phoneNumber: editingUser.phoneNumber,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        throw new Error(
          data.details || data.error || 'Failed to update user',
        );
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setSavingUser(false);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (
      !window.confirm(
        'Grant this user admin privileges? They will be able to access the admin dashboard.',
      )
    ) {
      return;
    }
    setActionUserId(userId);
    setActionKind('make-admin');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/make-admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'User promoted to admin',
        });
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to promote user',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to promote user',
        variant: 'destructive',
      });
    } finally {
      setActionUserId(null);
      setActionKind(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const label = `${user.firstName} ${user.lastName}`.trim() || user.email;
    if (
      !window.confirm(
        `Permanently delete ${label}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setActionUserId(user._id);
    setActionKind('delete');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        toast({
          title: 'User removed',
          description: data.message || 'The user was deleted.',
        });
        fetchUsers();
        fetchStats();
      } else {
        toast({
          title: 'Could not delete',
          description: data.details || data.error || 'Delete failed',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setActionUserId(null);
      setActionKind(null);
    }
  };

  const isRowBusy = (id: string) =>
    actionUserId === id && actionKind !== null;

  const isAlreadyAdmin = (user: User) =>
    user.isAdmin === true ||
    ['admin', 'super_admin', 'superadmin'].includes(
      String(user.role || '').toLowerCase(),
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#18181b] rounded-xl shadow-lg border border-white/[0.04] p-6">
        <h2 className="text-2xl font-bold text-white mb-4">User Management</h2>
        <p className="text-white/60 mb-4">Manage registered users and their access to trading tools.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatBox title="Total Users" value={stats.totalUsers.toString()} color="blue" />
          <StatBox title="Trial" value={stats.trial.toString()} color="gray" />
          <StatBox title="Active" value={stats.active.toString()} color="green" />
          <StatBox title="Expired" value={stats.expired.toString()} color="purple" />
          <StatBox title="Pending" value={stats.pending.toString()} color="orange" />
        </div>

        <div className="bg-[#18181b] rounded-xl shadow-lg border border-white/[0.04] overflow-hidden mt-6">
          <div className="p-6 border-b border-white/[0.04]">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">User Directory</h3>
              <button className="bg-[#8C57FF] hover:bg-[#8C57FF]/90 text-white px-4 py-2 rounded-lg text-sm shadow-[0_2px_6px_rgba(140,87,255,0.4)] transition-all">
                Add User
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
              <input
                placeholder="Search users…"
                value={headerSearch}
                onChange={(e) => {
                  setPage(1);
                  onHeaderSearchChange(e.target.value);
                }}
                className="w-full md:w-64 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-white placeholder:text-white/30"
              />

              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
                className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:ring-2 focus:ring-[#8C57FF]"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white/90">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white/90">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Plan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Expires On</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white/90">Email Verified</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white/90">Joined</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white/90 w-[200px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-[#18181b]/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          getPlanBadgeColor(user.subscriptionType)
                        }`}>
                          {getPlanDisplayName(user.subscriptionType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          getStatusBadgeColor(user.subscriptionStatus)
                        }`}>
                          {(user.subscriptionStatus || 'inactive').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">
                        {getExpiryDisplay(user)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                          user.emailVerified
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {user.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Edit user"
                            onClick={() => handleEditUser(user)}
                            disabled={isRowBusy(user._id)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#8C57FF]/40 bg-[#8C57FF]/10 px-3 text-xs font-medium text-[#c4b5fd] transition-colors hover:border-[#8C57FF]/70 hover:bg-[#8C57FF]/20 disabled:opacity-40"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Edit
                          </button>
                          {!isAlreadyAdmin(user) ? (
                            <button
                              type="button"
                              title="Grant admin access"
                              onClick={() => handleMakeAdmin(user._id)}
                              disabled={isRowBusy(user._id)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-300 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/20 disabled:opacity-40"
                            >
                              {actionUserId === user._id &&
                              actionKind === 'make-admin' ? (
                                <Loader2
                                  className="h-3.5 w-3.5 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                              )}
                              Make admin
                            </button>
                          ) : (
                            <span
                              className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-wide text-white/35"
                              title="Already has admin access"
                            >
                              Admin
                            </span>
                          )}
                          <button
                            type="button"
                            title="Delete user"
                            onClick={() => handleDeleteUser(user)}
                            disabled={
                              isRowBusy(user._id) ||
                              String(user._id) === String(admin?._id ?? '')
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 text-xs font-medium text-rose-300 transition-colors hover:border-rose-400/60 hover:bg-rose-500/20 disabled:pointer-events-none disabled:opacity-30"
                          >
                            {actionUserId === user._id &&
                            actionKind === 'delete' ? (
                              <Loader2
                                className="h-3.5 w-3.5 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-white/50">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between p-4 border-t border-white/[0.04] bg-black/10">
              <span className="text-sm text-white/60">
                Page {page} of {totalPages}
              </span>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 border border-white/10 rounded disabled:opacity-50 text-sm text-white/80 hover:bg-[#18181b]/5 transition-colors"
                >
                  ← Prev
                </button>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border border-white/10 rounded disabled:opacity-50 text-sm text-white/80 hover:bg-[#18181b]/5 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#18181b] rounded-xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={editingUser.firstName}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editingUser.lastName}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editingUser.phoneNumber || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, phoneNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF] text-white"
                  placeholder="+254..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-white/70 bg-[#18181b]/5 rounded-lg hover:bg-[#18181b]/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={savingUser}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-white bg-[#8C57FF] rounded-lg hover:bg-[#8C57FF]/90 shadow-[0_2px_6px_rgba(140,87,255,0.4)] transition-all disabled:opacity-50"
              >
                {savingUser ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ title, value, color = 'blue' }: { title: string; value: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'text-[#8C57FF] bg-[#8C57FF]/10',
    gray: 'text-white/60 bg-[#18181b]/5',
    green: 'text-emerald-500 bg-emerald-500/10',
    purple: 'text-[#8C57FF] bg-[#8C57FF]/10',
    orange: 'text-amber-500 bg-amber-500/10',
  };

  return (
    <div className={`rounded-xl p-5 border border-white/[0.04] flex flex-col justify-between ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80 mb-2">{title}</p>
      <p className="text-2xl font-bold opacity-100">{value}</p>
    </div>
  );
}

function getPlanDisplayName(type: string | null | undefined): string {
  const planNames: Record<string, string> = {
    free: 'Free Trial',
    basic: 'Weekly Plan',
    premium: 'Monthly Plan',
    pro: '3 Months Plan',
  };
  return planNames[type || 'free'] || 'Free Trial';
}

function getPlanBadgeColor(type: string | null | undefined): string {
  const colors: Record<string, string> = {
    free: 'bg-[#18181b]/5 text-white/70 border border-white/10',
    basic: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    premium: 'bg-[#8C57FF]/10 text-[#8C57FF] border border-[#8C57FF]/20',
    pro: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  };
  return colors[type || 'free'] || 'bg-[#18181b]/5 text-white/70 border border-white/10';
}

function getStatusBadgeColor(status: string | undefined): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    inactive: 'bg-[#18181b]/5 text-white/50 border border-white/10',
    expired: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
  };
  return colors[status || 'inactive'] || 'bg-[#18181b]/5 text-white/50 border border-white/10';
}

function getExpiryDisplay(user: User): string {
  // For free trial users
  if (!user.subscriptionType || user.subscriptionType === 'free') {
    if (user.freeTrialEndDate) {
      const expiryDate = new Date(user.freeTrialEndDate);
      const now = new Date();
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 0) {
        return `${expiryDate.toLocaleDateString()} (${daysRemaining}d left)`;
      } else {
        return `${expiryDate.toLocaleDateString()} (Expired)`;
      }
    }
    return 'No trial date';
  }
  
  // For paid subscriptions
  if (user.subscriptionEndDate) {
    const expiryDate = new Date(user.subscriptionEndDate);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0) {
      return `${expiryDate.toLocaleDateString()} (${daysRemaining}d left)`;
    } else {
      return `${expiryDate.toLocaleDateString()} (Expired)`;
    }
  }
  
  return 'No expiry date';
}

