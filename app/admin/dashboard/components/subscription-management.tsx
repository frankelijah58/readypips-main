'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  RefreshCw, 
  Users, 
  DollarSign, 
  Calendar, 
  Search, 
  ChevronRight, 
  CreditCard,
  AlertCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface Subscription {
  _id: string;
  plan: string;
  price: number;
  status: string;
  startDate: string;
  endDate: string;
  userName?: string;
}

interface PendingPayment {
  _id: string;
  reference: string;
  planId: string;
  provider: string;
  amount: number;
  createdAt: string;
  email: string;
  userName?: string;
}

export default function SubscriptionManagement({ admin }: { admin: any }) {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, expired: 0, pending: 0, revenue: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [subRes, pendingRes, revRes] = await Promise.all([
        fetch('/api/admin/subscriptions', { headers }),
        fetch('/api/admin/payments/pending', { headers }),
        fetch('/api/admin/revenuev2', { headers })
      ]);

      const subData = await subRes.json();
      const pendData = await pendingRes.json();
      const revData = await revRes.json();

      setSubscriptions(subData.subscriptions || []);
      setPendingPayments(pendData.pending || []);
      
      setStats({
        active: subData.subscriptions?.filter((s: Subscription) => s.status === 'active').length || 0,
        expired: subData.subscriptions?.filter((s: Subscription) => s.status === 'expired').length || 0,
        pending: pendData.pending?.length || 0,
        revenue: revData.revenue?.total || 0
      });
    } catch (error) {
      toast({ title: 'Sync Error', description: 'Could not refresh dashboard data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSubs = subscriptions.filter(s => 
    s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Revenue & Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time overview of your subscription health and growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users or plans..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all group"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<TrendingUp className="w-6 h-6 text-blue-600" />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Active Subs" value={stats.active.toString()} icon={<UserCheck className="w-6 h-6 text-emerald-600" />} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Pending Checkout" value={stats.pending.toString()} icon={<Clock className="w-6 h-6 text-amber-600" />} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Expired" value={stats.expired.toString()} icon={<AlertCircle className="w-6 h-6 text-slate-600" />} color="text-slate-600" bg="bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Activity Feed */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Live Checkout Feed
            </h3>
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full animate-pulse">Live</span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {pendingPayments.slice(0, 6).map((pay) => (
              <div key={pay._id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {pay.userName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-none">{pay.userName || 'Guest'}</p>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-bold">{pay.planId}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-700">${pay.amount}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(pay.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded capitalize">{pay.provider}</span>
                </div>
              </div>
            ))}
            {pendingPayments.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm">No active checkout sessions</div>
            )}
          </div>
        </div>

        {/* Main Subscriptions Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 px-2">Completed Subscriptions</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Subscriber</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Amount</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Expires</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubs.map((sub) => (
                    <tr key={sub._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 uppercase text-xs tracking-wider">{sub.plan}</div>
                        <div className="text-xs text-slate-400">{sub.userName || 'Anonymous'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                        KES {sub.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(sub.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-200 rounded-lg transition-all">
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSubs.length === 0 && (
                <div className="p-20 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-400">No subscriptions found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
      <div className={`${bg} p-3 rounded-xl`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    trial: 'bg-blue-100 text-blue-700 border-blue-200',
    expired: 'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-tighter ${styles[status] || styles.expired}`}>
      {status}
    </span>
  );
}