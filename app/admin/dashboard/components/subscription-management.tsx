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
  Filter,
  MoreVertical,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const TABS = [
  { id: 'all', label: 'All Subscriptions' },
  { id: 'active', label: 'Active' },
  { id: 'expired', label: 'Expired' },
];

export default function SubscriptionManagement({ admin }: { admin: any }) {
  const { toast } = useToast();

  // -------------------- STATE --------------------
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, expired: 0, pending: 0, revenue: 0 });
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirmData, setBulkConfirmData] = useState<{ type: 'status' | 'extend'; value: string | number; label: string; } | null>(null);

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
      const statusFilter = activeTab === 'all' ? '' : `&status=${activeTab}`;
      const [subRes, revRes, pendRes] = await Promise.all([
        fetch(`/api/admin/subscriptions?page=${currentPage}&limit=10&search=${encodeURIComponent(searchTerm)}${statusFilter}`, { headers: authHeaders() }),
        fetch('/api/admin/revenuev2', { headers: authHeaders() }),
        fetch(`/api/admin/payments/pending?page=${pendingPage}&limit=4`, { headers: authHeaders() }) // Adjusted limit for vertical flow
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
  }, [currentPage, searchTerm, activeTab, pendingPage, authHeaders, toast]);

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

  const confirmAndExecutev2 = () => {
    if (!bulkConfirmData) return;
    const updates = bulkConfirmData.type === 'status' 
      ? { status: bulkConfirmData.value as string }
      : { extendDays: bulkConfirmData.value as number };
    // Call your handleBulkAction logic here
    setBulkConfirmData(null);
  };

  
    const handlePaymentActionv2 = async (id: string, action: 'approve' | 'reject') => {
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
  
    const handleUpdateSubscriptionv2 = async (id: string, updates: { endDate?: string; status?: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/update', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ subscriptionId: id, ...updates }),
      });
  
      if (!res.ok) throw new Error();
  
      toast({ title: 'Success', description: 'User status updated.' });
      fetchData(); // Refresh the table
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update subscription.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
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
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-10 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      
      {/* 1. HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Subscription Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage user access and verify incoming payments.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-full md:w-80 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Button variant="outline" className="bg-white" onClick={fetchData}>
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

      <hr className="border-slate-200" />

      {/* 3. PENDING ACTIONS (Now a full-width section) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Verification Queue</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2">{stats.pending} Pending</span>
            <Button variant="outline" className={"text-white"} size="sm" disabled={pendingPage === 1} onClick={() => setPendingPage(p => p - 1)}><ChevronLeft className="w-4 h-4"/></Button>
            <Button variant="outline" className={"text-white"} size="sm" disabled={pendingPage === pendingTotalPages} onClick={() => setPendingPage(p => p + 1)}><ChevronRight className="w-4 h-4"/></Button>
          </div>
        </div>

        {pendingPayments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pendingPayments.map((pay) => (
              <PendingCard key={pay._id} pay={pay} onAction={handlePaymentAction} processingId={processingId} />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">No pending verifications</p>
          </div>
        )}
      </section>

      {/* 4. MAIN DATABASE (Now a full-width section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Subscriber Ledger</h3>
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4 text-center w-10">
                    <input type="checkbox" checked={selectedIds.length === subscriptions.length} onChange={() => {toggleSelectAll()}} className="rounded accent-indigo-600" />
                  </th>
                  <th className="px-6 py-4 text-left font-bold">Subscriber</th>
                  <th className="px-6 py-4 text-left font-bold">Status</th>
                  <th className="px-6 py-4 text-left font-bold">Timeline</th>
                  <th className="px-6 py-4 text-right font-bold">Price</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.includes(sub._id)} onChange={() => {toggleSelect(sub._id)}} className="rounded accent-indigo-600" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {sub.userName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sub.userName}</div>
                          <div className="text-[10px] text-indigo-600 font-bold uppercase">{sub.plan}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(sub.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                      ${sub.price}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                          {/* <MoreVertical className="w-4 h-4" /> */}
                          {/* // Add this inside your table row (tr) under the "MoreVertical" button */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => extendSevenDays(sub)}>
                                Extend 7 Days
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => revokeAccess(sub._id)}>
                                Revoke Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </button>
                      {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {}}>Extend 7 Days</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Revoke Access</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            
          </div>
          
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs font-medium text-slate-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" className={"text-white"} size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" className={"text-white"} size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Bulk Action Bar (Same as before) */}
      {selectedIds.length > 0 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 z-50">
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
                      className="text-slate-400"
                      onClick={() => setSelectedIds([])}
                    >
                      Cancel
                    </Button>
                  </div>
                {/* <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleBulkAction({ status: 'active' })}
                  >
                    Activate All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-white border-slate-700 hover:bg-slate-800"
                    onClick={() => handleBulkAction({ status: 'expired' })}
                  >
                    Expire All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-white border-slate-700 hover:bg-slate-800"
                    onClick={() => handleBulkAction({ extendDays: 7 })}
                  >
                    +7 Days Access
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-slate-400 hover:text-white"
                    onClick={() => setSelectedIds([])}
                  >
                    Cancel
                  </Button>
                </div> */}
              </div>
            )}
      {/* {selectedIds.length > 0 && (
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4">
            <span className="text-sm font-bold border-r border-slate-700 pr-6">{selectedIds.length} Selected</span>
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600">Activate All</Button>
              <Button size="sm" variant="outline" className="text-white border-slate-700" onClick={() => setSelectedIds([])}>Cancel</Button>
            </div>
         </div>
      )} */}


      {bulkConfirmData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2">Are you absolutely sure?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              You are about to <span className="font-bold text-slate-900">{bulkConfirmData.label}</span> for 
              <span className="font-bold text-indigo-600"> {selectedIds.length} users</span>. 
              This action will update the database immediately.
            </p>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-600"
                onClick={() => setBulkConfirmData(null)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-xl h-12 font-bold bg-slate-900 hover:bg-black text-white"
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
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs">{pay.userName?.charAt(0)}</div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">{pay.userName}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{pay.provider}</p>
          </div>
        </div>
        <span className="text-sm font-black text-indigo-600">${pay.amount}</span>
      </div>
      <div className="text-[11px] text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg truncate">
        {pay.email}
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={() => onAction(pay._id, 'approve')}
          className="flex-1 h-8 text-[10px] font-bold bg-slate-900"
          disabled={!!processingId}
        >
          {processingId === pay._id ? <RefreshCw className="animate-spin w-3 h-3" /> : 'Approve'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => onAction(pay._id, 'reject')}
          className="flex-1 h-8 text-[10px] font-bold hover:bg-rose-50"
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
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className={`p-2 rounded-xl ${colors[color]}`}>{icon}</div>
        {trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    expired: 'bg-red-50 text-red-700 border-red-100',
    trial: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${styles[status] || styles.expired}`}>
      {status}
    </span>
  );
}