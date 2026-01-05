'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Phone,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stats {
  active: number;
  expired: number;
  pending: number;
  revenue: number;
}

export default function SubscriptionManagement() {
  const { toast } = useToast();

  // -------------------- DATA STATE --------------------
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    active: 0,
    expired: 0,
    pending: 0,
    revenue: 0,
  });

  // -------------------- UI STATE --------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // -------------------- PAGINATION --------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 10;
  const PENDING_LIMIT = 5;

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  // -------------------- FETCH MAIN DATA --------------------
  const fetchMainData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, revRes] = await Promise.all([
        fetch(
          `/api/admin/subscriptions?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(
            searchTerm
          )}`,
          { headers: authHeaders() }
        ),
        fetch('/api/admin/revenuev2', { headers: authHeaders() }),
      ]);

      if (!subRes.ok || !revRes.ok) throw new Error();

      const subData = await subRes.json();
      const revData = await revRes.json();

      setSubscriptions(subData.subscriptions ?? []);
      setTotalPages(subData.totalPages ?? 1);

      setStats((prev) => ({
        ...prev,
        active: subData.activeCount ?? 0,
        expired: subData.expiredCount ?? 0,
        revenue: revData?.revenue?.total ?? 0,
      }));
    } catch {
      toast({
        title: 'Failed to load subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, toast]);

  // -------------------- FETCH PENDING PAYMENTS --------------------
  const fetchPendingData = useCallback(async () => {
  try {
    const res = await fetch(
      `/api/admin/payments/pending?page=${pendingPage}&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!res.ok) throw new Error();

    const data = await res.json();

    setPendingPayments(data.pending ?? []);
    setPendingTotalPages(data.totalPages ?? 1);

    // ✅ Stats now always reflect server truth
    setStats((prev) => ({
      ...prev,
      pending: data.totalCount ?? 0,
    }));

    // 🔒 Clamp page if it becomes invalid
    if (pendingPage > (data.totalPages ?? 1)) {
      setPendingPage(data.totalPages ?? 1);
    }
  } catch (error) {
    console.error('Pending fetch error:', error);
  }
}, [pendingPage]);


  // const fetchPendingData = useCallback(async () => {
  //   try {
  //     const res = await fetch(
  //       `/api/admin/payments/pending?page=${pendingPage}&limit=${PENDING_LIMIT}`,
  //       { headers: authHeaders() }
  //     );

  //     if (!res.ok) throw new Error();

  //     const data = await res.json();

  //     setPendingPayments(data.pending ?? []);
  //     setPendingTotalPages(data.totalPages ?? 1);

  //     setStats((prev) => ({
  //       ...prev,
  //       pending: data.totalCount ?? 0,
  //     }));
  //   } catch (err) {
  //     console.error('Pending payments fetch error:', err);
  //   }
  // }, [pendingPage]);

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    const debounce = setTimeout(fetchMainData, 400);
    return () => clearTimeout(debounce);
  }, [fetchMainData]);

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

  // -------------------- ACTIONS --------------------
  const handlePaymentAction = async (
    id: string,
    action: 'approve' | 'reject'
  ) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/payments/action', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ intentId: id, action }),
      });

      if (!res.ok) throw new Error();

      toast({ title: `Payment ${action}d successfully` });
      fetchPendingData();
      fetchMainData();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  // -------------------- UI --------------------
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Financial Control
          </h1>
          <p className="text-slate-500 text-sm">
            Manage subscriptions and verify payments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="pl-10 pr-4 py-2 border rounded-xl text-sm w-64"
              placeholder="Search name or email"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => {
              // fetchMainData();
              // fetchPendingData();
              setPendingPage(1); // reset safely
              fetchMainData();

            }}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenue"
          value={`$${stats.revenue}`}
          icon={<TrendingUp />}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<UserCheck />}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          title="In Queue"
          value={stats.pending}
          icon={<Clock />}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          title="Churned"
          value={stats.expired}
          icon={<AlertCircle />}
          color="text-slate-600"
          bg="bg-slate-100"
        />
      </div>

      {/* Pending + Table sections remain unchanged visually */}
      {/* (Your existing JSX here is already correct and performant) */}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Verification Feed (Left) */}
              {/* PAGINATED PENDING FEED */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Pending Approval
                  </h3>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                    {pendingPage} / {pendingTotalPages}
                  </span>
                </div>
      
                <div className="space-y-3 min-h-[500px]">
                  {pendingPayments.length > 0 ? (
                    pendingPayments.map((pay) => (
                      <div key={pay._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-blue-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{pay.userName || 'Guest'}</p>
                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">
                              {pay.provider} • {pay.planId}
                            </p>
                          </div>
                          <span className="text-sm font-black text-slate-900">${pay.amount}</span>
                        </div>
      
                        <div className="space-y-1 mb-4 text-[11px] text-slate-500">
                          <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {pay.email}</div>
                          {pay.phoneNumber && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {pay.phoneNumber}</div>}
                        </div>
      
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handlePaymentAction(pay._id, 'approve')}
                            disabled={!!processingId}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-xl h-9 text-xs font-bold"
                          >
                            {processingId === pay._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Approve'}
                          </Button>
                          <Button 
                            onClick={() => handlePaymentAction(pay._id, 'reject')}
                            disabled={!!processingId}
                            variant="outline" 
                            className="flex-1 rounded-xl h-9 text-xs font-bold border-slate-200"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 bg-white rounded-3xl border border-dashed border-slate-200">
                      <Clock className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs font-medium">Clear for now!</p>
                    </div>
                  )}
                </div>
      
                {/* Pending Pagination Controls */}
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <Button 
                    // variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    disabled={pendingPage <= 1} 
                    onClick={() => setPendingPage(prev => prev - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Queue Page {pendingPage}
                  </span>
      
                  <Button 
                    // variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    disabled={pendingPage >= pendingTotalPages} 
                    onClick={() => setPendingPage(prev => prev + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                {/* <div className="flex items-center justify-center gap-4 py-2">
                  <Button 
                    variant="ghost" size="sm" className="rounded-full"
                    disabled={pendingPage === 1}
                    onClick={() => setPendingPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-bold text-slate-400">Page {pendingPage}</span>
                  <Button 
                    variant="ghost" size="sm" className="rounded-full"
                    disabled={pendingPage === pendingTotalPages}
                    onClick={() => setPendingPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div> */}
              </div>
      
              {/* Master Table (Right) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-slate-800 px-2">Subscriptions Database</h3>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-[10px]">User Details</th>
                          <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-[10px]">Status</th>
                          <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase text-[10px]">Expiry</th>
                          <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase text-[10px]">Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscriptions.map((sub) => (
                          <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 uppercase text-[11px] tracking-tight">{sub.plan}</div>
                              <div className="text-xs text-slate-400 font-medium">{sub.userName}</div>
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={sub.status} /></td>
                            <td className="px-6 py-4 text-[11px] text-slate-500 font-bold">
                              {new Date(sub.endDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                              ${sub.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
      
                  {/* Pagination Controls */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      Page <span className="text-slate-900 font-bold">{currentPage}</span> of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || loading}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
    </div>
  );
}

/* -------------------- SUB COMPONENTS -------------------- */

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm flex gap-4">
      <div className={`${bg} p-2.5 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400">
          {title}
        </p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    expired: 'bg-slate-100 text-slate-600 border-slate-200',
    trial: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
        styles[status] ?? styles.expired
      }`}
    >
      {status}
    </span>
  );
}
