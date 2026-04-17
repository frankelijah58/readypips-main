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
  UserCheck, ShieldAlert, MoreVertical,
  Calendar,
  CreditCard,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const TABS = [
  { id: 'all', label: 'All Subscriptions' },
  { id: 'active', label: 'Active' },
  { id: 'expired', label: 'Expired' },
];

export default function SubscriptionManagement({
  admin,
  headerSearch,
  onHeaderSearchChange,
  paymentProviderFilter = "all",
}: {
  admin: any;
  headerSearch: string;
  onHeaderSearchChange: (value: string) => void;
  paymentProviderFilter?: "all" | "mpesa" | "binance" | "card";
}) {
  const { toast } = useToast();

  // -------------------- STATE --------------------
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, expired: 0, pending: 0, revenue: 0 });

  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirmData, setBulkConfirmData] = useState<{ type: 'status' | 'extend'; value: string | number; label: string; } | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_queue_expanded');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === subscriptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subscriptions.map(s => s._id));
    }
  };

  // -------------------- HANDLERS (Same logic as before) --------------------
  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {

      const dateFilters = `&startDate=${startDate}&endDate=${endDate}`;
      const providerFilter = `&provider=${encodeURIComponent(paymentProviderFilter)}`;

      const statusFilter = activeTab === 'all' ? '' : `&status=${activeTab}`;
      const [subRes, revRes, pendRes] = await Promise.all([
        fetch(`/api/admin/subscriptions?page=${currentPage}&limit=10&search=${encodeURIComponent(headerSearch)}${statusFilter}${providerFilter}${dateFilters}`, { headers: authHeaders() }),
        fetch('/api/admin/revenuev2', { headers: authHeaders() }),
        fetch(`/api/admin/payments/pending?page=${pendingPage}&limit=4&provider=${encodeURIComponent(paymentProviderFilter)}`, { headers: authHeaders() }) // Adjusted limit for vertical flow
      ]);

      const subData = await subRes.json();
      const revData = await revRes.json();
      const pendData = await pendRes.json();

      setSubscriptions(subData.subscriptions ?? []);
      setTotalPages(subData.totalPages ?? 1);
      setPendingPayments(pendData.pending ?? []);
      setPendingTotalPages(pendData.totalPages ?? 1);

      setStats({
        active: subData.activeCount ?? 0,
        expired: subData.expiredCount ?? 0,
        pending: pendData.totalCount ?? 0,
        revenue: revData?.revenue?.total ?? 0,
      });
    } catch (err) {
      toast({ title: 'Sync Error', description: 'Could not update dashboard data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, headerSearch, activeTab, pendingPage, startDate, endDate, authHeaders, toast, paymentProviderFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 400);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handlePaymentAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/payments/action', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ intentId: id, action }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `Successfully ${action}ed` });
      fetchData();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateSubscription = async (id: string, updates: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ subscriptionId: id, ...updates }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Success', description: 'User updated.' });
      fetchData();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };



  // 2. Sync changes to localStorage
  useEffect(() => {
    localStorage.setItem('admin_queue_expanded', JSON.stringify(isQueueOpen));
  }, [isQueueOpen]);

  // Example usage for an "Extend 7 Days" button:
  const extendSevenDays = (sub: any) => {
    const currentEnd = new Date(sub.endDate);
    currentEnd.setDate(currentEnd.getDate() + 7);
    handleUpdateSubscription(sub._id, { endDate: currentEnd.toISOString() });
  };

  // Example usage for a "Revoke" button:
  const revokeAccess = (id: string) => {
    handleUpdateSubscription(id, { status: 'expired' });
  };

  const handleBulkAction = async (updates: { status?: string; extendDays?: number }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ids: selectedIds, // The array of IDs from your state
          ...updates,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Bulk update failed');

      toast({
        title: 'Bulk Action Complete',
        description: `Successfully updated ${selectedIds.length} subscriptions.`,
      });

      // Reset selection and refresh data
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  // Triggered by the Floating Bar buttons
  const initiateBulkConfirm = (type: 'status' | 'extend', value: string | number, label: string) => {
    setBulkConfirmData({ type, value, label });
  };

  // The actual execution
  const confirmAndExecute = () => {
    if (!bulkConfirmData) return;

    const updates = bulkConfirmData.type === 'status'
      ? { status: bulkConfirmData.value as string }
      : { extendDays: bulkConfirmData.value as number };

    handleBulkAction(updates);
    setBulkConfirmData(null); // Close modal
  };


  return (
    <div className="space-y-10 font-sans text-white h-full relative">

      {/* 1. HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#8C57FF]" />
            Subscription Management
          </h1>
          <p className="text-white/60 text-sm mt-1">Manage user access and verify incoming payments.</p>
          <p className="text-white/40 text-xs mt-1">
            Provider filter:{" "}
            <span className="text-[#8C57FF] font-semibold uppercase">
              {paymentProviderFilter}
            </span>
          </p>
        </div>

        {/* Date Picker Group */}
        {/* <div className="flex items-center gap-2 bg-[#18181b]/5 p-1.5 rounded-xl border border-white/10">
          <Calendar className="w-4 h-4 text-white/40 ml-2" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white/80" />
          <span className="text-slate-300">-</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none text-white/80" />
          {(startDate || endDate) && (
            <button onClick={() => {setStartDate(''); setEndDate('')}} className="p-1 hover:bg-[#18181b]/5 rounded-md">
              <X className="w-3 h-3 text-white/60" />
            </button>
          )}
        </div> */}

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#8C57FF] transition-colors" />
            <input
              className="pl-10 pr-4 py-2 bg-[#18181b] border border-white/10 rounded-xl text-sm w-full md:w-80 shadow-sm outline-none focus:ring-2 focus:ring-[#8C57FF] text-white placeholder:text-white/30"
              placeholder="Search users..."
              value={headerSearch}
              onChange={(e) => {
                onHeaderSearchChange(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button variant="outline" className="bg-[#18181b] border-white/10 text-white hover:bg-[#18181b]/5" onClick={fetchData}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. STATS GRID (Full Width) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<TrendingUp />} trend="+12.5%" color="indigo" />
        <StatCard title="Active Users" value={stats.active} icon={<UserCheck />} color="emerald" />
        <StatCard title="Action Required" value={stats.pending} icon={<Clock />} color="amber" />
        <StatCard title="Churned" value={stats.expired} icon={<AlertCircle />} color="slate" />
      </div>

      <hr className="border-white/[0.04]" />

      <section className="space-y-6 transition-all duration-300">
        <div
          className="flex items-center justify-between cursor-pointer group select-none"
          onClick={() => setIsQueueOpen(!isQueueOpen)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isQueueOpen ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#18181b]/5 border-white/10'
              }`}>
              <ShieldAlert className={`w-5 h-5 ${isQueueOpen ? 'text-amber-500' : 'text-white/40'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Verification Queue
                {!isQueueOpen && stats.pending > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    {stats.pending}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-white/50 font-medium">
                {isQueueOpen ? 'Click to minimize' : 'Click to expand pending requests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isQueueOpen && (
              <div className="hidden md:flex items-center gap-2 mr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={pendingPage === 1}
                  onClick={(e) => { e.stopPropagation(); setPendingPage(p => p - 1); }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {pendingPage} / {pendingTotalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={pendingPage === pendingTotalPages}
                  onClick={(e) => { e.stopPropagation(); setPendingPage(p => p + 1); }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className={`p-2 rounded-full group-hover:bg-[#18181b]/5 transition-transform duration-300 ${isQueueOpen ? 'rotate-180' : 'rotate-0'}`}>
              <ChevronDown className="w-5 h-5 text-white/40" />
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        {isQueueOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {pendingPayments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pendingPayments.map((pay) => (
                  <PendingCard key={pay._id} pay={pay} onAction={handlePaymentAction} processingId={processingId} />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-3xl bg-[#18181b]/5">
                <p className="text-sm font-medium text-white/40 uppercase tracking-widest">All verifications cleared</p>
              </div>
            )}
          </div>
        )}
      </section>
      {/* 4. MAIN DATABASE (Now a full-width section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Subscriber Ledger</h3>
          <div className="flex bg-black/20 p-1 rounded-xl">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-[#18181b] text-white shadow-sm' : 'text-white/50 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20 border-b border-white/[0.04]">
                <tr className="text-[10px] uppercase tracking-widest text-white/50">
                  <th className="px-6 py-4 text-center w-10">
                    <input type="checkbox" checked={selectedIds.length === subscriptions.length} onChange={() => { toggleSelectAll() }} className="rounded accent-[#8C57FF]" />
                  </th>
                  <th className="px-6 py-4 text-left font-bold">Subscriber</th>
                  <th className="px-6 py-4 text-left font-bold">Status</th>
                  <th className="px-6 py-4 text-left font-bold">Timeline</th>
                  <th className="px-6 py-4 text-right font-bold">Price</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-[#18181b]/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.includes(sub._id)} onChange={() => { toggleSelect(sub._id) }} className="rounded accent-[#8C57FF]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#8C57FF]/10 text-[#8C57FF] flex items-center justify-center font-bold text-xs border border-[#8C57FF]/20">
                          {sub.userName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{sub.userName}</div>
                          <div className="flex items-center gap-1 text-white/50 text-xs">{sub.email}</div>
                          <div className="flex items-center gap-1 text-white/50 text-xs">{sub.phoneNumber}</div>
                          <div className="flex items-center gap-1 text-white/50 text-xs">{sub.tradingviewUsername}</div>
                          <div className="text-[10px] text-[#8C57FF] font-bold uppercase">{sub.plan}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-white/40" />
                        {new Date(sub.updatedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white/80">
                      <div className="leading-tight">
                        {typeof sub.priceKes === 'number' && sub.priceKes > 0 && (
                          <div>KES {Number(sub.priceKes).toLocaleString()}</div>
                        )}
                        {typeof sub.priceUsd === 'number' && sub.priceUsd > 0 ? (
                          <div className="text-[#8C57FF]">${Number(sub.priceUsd).toLocaleString()}</div>
                        ) : (
                          <div className="text-[#8C57FF]">
                            ${Number(sub.price || 0).toLocaleString()}
                          </div>
                        )}
                        {sub.fxRateKesToUsd ? (
                          <div className="text-[10px] font-normal text-white/40">
                            FX {Number(sub.fxRateKesToUsd).toFixed(6)}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                     
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-[#18181b]/5"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#18181b] border-white/10 text-white">
                            <DropdownMenuItem className="focus:bg-[#18181b]/5 focus:text-white" onClick={() => extendSevenDays(sub)}>
                              Extend 7 Days
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400" onClick={() => revokeAccess(sub._id)}>
                              Revoke Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>


          </div>

          <div className="p-4 border-t border-white/[0.04] bg-black/20 flex items-center justify-between">
            <p className="text-xs font-medium text-white/50">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="text-white border-white/10 hover:bg-[#18181b]/5" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" className="text-white border-white/10 hover:bg-[#18181b]/5" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Bulk Action Bar (Same as before) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#18181b]/5 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 z-50">
          <span className="text-sm font-bold border-r border-slate-700 pr-6">
            {selectedIds.length} Selected
          </span>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-emerald-600"
              onClick={() => initiateBulkConfirm('status', 'active', 'Set to Active')}
            >
              Activate All
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-white border-slate-700"
              onClick={() => initiateBulkConfirm('status', 'expired', 'Mark as Expired')}
            >
              Expire All
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-white border-slate-700"
              onClick={() => initiateBulkConfirm('extend', 7, 'Extend by 7 Days')}
            >
              +7 Days Access
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/40"
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {bulkConfirmData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#18181b]/5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">Are you absolutely sure?</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              You are about to <span className="font-bold text-white">{bulkConfirmData.label}</span> for
              <span className="font-bold text-indigo-600"> {selectedIds.length} users</span>.
              This action will update the database immediately.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12 font-bold border-white/10 text-white/80"
                onClick={() => setBulkConfirmData(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl h-12 font-bold bg-[#18181b]/5 hover:bg-black text-white"
                onClick={confirmAndExecute}
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Yes, Proceed'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* -------------------- REFINED COMPONENTS -------------------- */

function PendingCard({ pay, onAction, processingId }: any) {
  const originalAmount =
    typeof pay.amount_paid_original === "number"
      ? pay.amount_paid_original
      : typeof pay.amountUsd === "number"
        ? pay.amountUsd
        : typeof pay.amountKes === "number"
          ? pay.amountKes
          : Number(pay.amount || 0);
  const originalCurrency = String(
    pay.currency_original ||
    (typeof pay.amountUsd === "number" ? "USD" : pay.currency || "KES")
  ).toUpperCase();
  const convertedKes =
    typeof pay.amount_converted === "number"
      ? pay.amount_converted
      : typeof pay.amountKes === "number"
        ? pay.amountKes
        : String(pay.currency || "").toUpperCase() === "KES"
          ? Number(pay.amount || 0)
          : null;

  const status = String(pay.status || 'pending').toLowerCase();
  const statusColorClass = status.includes('pending')
    ? 'bg-yellow-500/10 border-yellow-500/20'
    : status.includes('paid') || status.includes('success')
      ? 'bg-emerald-500/10 border-emerald-500/20'
      : status.includes('failed') || status.includes('decline')
        ? 'bg-rose-500/10 border-rose-500/20'
        : 'bg-yellow-500/10 border-yellow-500/20';
  const statusTextClass = status.includes('pending')
    ? 'text-yellow-400'
    : status.includes('paid') || status.includes('success')
      ? 'text-emerald-400'
      : status.includes('failed') || status.includes('decline')
        ? 'text-rose-400'
        : 'text-yellow-400';

  const transactionId =
    pay.transactionId || pay.rawBinanceResponse?.transactionId || '';
  const walletAddress =
    pay.walletAddress || pay.senderWallet || pay.rawBinanceResponse?.senderWallet || pay.rawBinanceResponse?.depositAddress || '';
  const notes = pay.notes || pay.note || pay.rawBinanceResponse?.note || '';

  return (
    <div className={`border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all bg-[#18181b] ${statusColorClass} hover:border-white/10`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#18181b]/5 flex items-center justify-center font-bold text-xs text-white">{pay.userName?.charAt(0)}</div>
          <div>
            <h4 className="font-bold text-sm text-white">{pay.userName}</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase">{pay.provider}</p>
          </div>
        </div>
        <div className="text-right">
          {convertedKes != null ? (
            <div className="text-xs font-black text-white/80">
              KES {Number(convertedKes).toLocaleString()}
            </div>
          ) : null}
          <span className="text-sm font-black text-[#8C57FF]">
            {originalCurrency} {Number(originalAmount ?? 0).toLocaleString()}
          </span>
          {pay.amountMismatch === true ? (
            <div className="text-[10px] font-bold text-rose-400 mt-1">Mismatch</div>
          ) : null}
          {pay.status && (
            <div className={`text-[10px] font-bold uppercase mt-1 ${statusTextClass}`}>
              {pay.status}
            </div>
          )}
        </div>
      </div>
      <div className="text-[11px] text-white/60 mb-4 bg-black/20 p-2 rounded-lg truncate">
        {pay.email}
      </div>
      {pay.provider === 'binance' && (transactionId || walletAddress || notes) && (
        <div className="mb-4 space-y-2 bg-black/20 p-2.5 rounded-lg">
          {transactionId && (
            <div>
              <p className="text-[9px] font-bold uppercase text-white/40 mb-0.5">Transaction ID</p>
              <p className="text-[10px] text-white/80 break-all font-mono">{transactionId}</p>
            </div>
          )}
          {walletAddress && (
            <div>
              <p className="text-[9px] font-bold uppercase text-white/40 mb-0.5">Wallet Address</p>
              <p className="text-[10px] text-white/80 break-all font-mono">{walletAddress}</p>
            </div>
          )}
          {notes && (
            <div>
              <p className="text-[9px] font-bold uppercase text-white/40 mb-0.5">Notes</p>
              <p className="text-[10px] text-white/70 line-clamp-2">{notes}</p>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => onAction(pay._id, 'approve')}
          className="flex-1 h-8 text-[10px] font-bold bg-[#8C57FF] hover:bg-[#8C57FF]/90 text-white shadow-[0_2px_6px_rgba(140,87,255,0.4)]"
          disabled={!!processingId}
        >
          {processingId === pay._id ? <RefreshCw className="animate-spin w-3 h-3" /> : 'Approve'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onAction(pay._id, 'reject')}
          className="flex-1 h-8 text-[10px] font-bold hover:bg-rose-500/10 text-rose-400 border-rose-500/20"
          disabled={!!processingId}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: any) {
  const colors: any = {
    indigo: 'bg-[#8C57FF]/10 text-[#8C57FF] border-[#8C57FF]/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    slate: 'bg-[#18181b]/5 text-white/60 border-white/10',
  };
  return (
    <div className="bg-[#18181b] p-5 rounded-3xl border border-white/[0.04] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className={`p-2 rounded-xl border ${colors[color]}`}>{icon}</div>
        {trend && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">{trend}</span>}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">{title}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    expired: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    trial: 'bg-[#8C57FF]/10 text-[#8C57FF] border-[#8C57FF]/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${styles[status] || styles.expired}`}>
      {status}
    </span>
  );
}
