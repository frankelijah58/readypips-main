"use client";

import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Copy, DollarSign, TrendingUp, Users, Zap, Inbox, ExternalLink, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { Navigation } from "@/components/navigation";
import { useRouter } from "next/navigation";

type FilterType = "all" | "paid" | "pending";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const endpoint = user.role === "affiliate" ? "/api/affiliate/dashboard" : "/api/partner/dashboard";
        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDashboard(data);
      } catch (err) {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const copyToClipboard = () => {
    if (!dashboard?.referralCode) return;
    navigator.clipboard.writeText(dashboard.referralCode);
    toast.success("Link copied to clipboard");
  };

  const { stats, revenueChart, referrals = [], referralCode } = dashboard || {};

  const filteredReferrals = useMemo(() => {
    if (filter === "paid") return referrals.filter((r: any) => r.hasPaid);
    if (filter === "pending") return referrals.filter((r: any) => !r.hasPaid);
    return referrals;
  }, [filter, referrals]);

  if (loading) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="relative">
            <div className="w-12 h-12 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 blur-lg bg-indigo-500/20 rounded-full animate-pulse" />
        </div>
        <p className="text-zinc-500 text-[10px] mt-6 uppercase tracking-[0.2em] font-medium">
          Synchronizing Data
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      <Navigation />
      
      <main className="max-w-7xl mx-auto p-6 lg:p-10 space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Analytics
            </h1>
            <p className="text-zinc-500 font-medium">
              Welcome back, <span className="text-zinc-200">{user?.email?.split('@')[0]}</span>
            </p>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-1.5 pl-4 rounded-2xl">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Your Partner Link</span>
                    <span className="text-sm font-mono text-indigo-400">{referralCode || '...'}</span>
                </div>
                <button 
                    onClick={copyToClipboard}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>
          </div>
        </header>

        {/* High-Level Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Revenue" value={`$${stats?.totalRevenue?.toFixed(0)}`} icon={DollarSign} color="text-emerald-400" />
          <StatCard title="Referrals" value={stats?.totalReferrals} icon={Users} color="text-blue-400" />
          <StatCard title="Conversions" value={stats?.paidReferrals} icon={Zap} color="text-indigo-400" />
          <StatCard title="Pending" value={stats?.pendingReferrals} icon={Inbox} color="text-zinc-500" />
          <StatCard title="CR" value={stats?.conversionRate} icon={TrendingUp} color="text-amber-400" isLast />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <section className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                   Earnings Flow
                </h3>
                <p className="text-xs text-zinc-500">Revenue growth over the last period</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" /> 12% Growth
              </div>
            </div>

            <div className="h-[320px] w-full">
              {revenueChart?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                        itemStyle={{ color: '#818cf8' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#chartGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState label="No revenue data available" />
              )}
            </div>
          </section>

          {/* Activity Sidebar */}
          <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 flex flex-col">
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <button onClick={() => router.push(`/admin/partner-dashbaord/${user?._id}`)} className="text-xs text-indigo-400 hover:underline">
                    View All
                </button>
              </div>

              {/* Segmented Filter */}
              <div className="flex p-1 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                {["all", "paid", "pending"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as FilterType)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg ${
                      filter === f ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                {filteredReferrals.length ? (
                  filteredReferrals.slice(0, 5).map((r: any) => (
                    <div key={r._id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${r.hasPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          {r.firstName[0]}{r.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">{r.firstName} {r.lastName}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{r.email.slice(0, 12)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {r.hasPaid ? (
                           <div className="flex flex-col items-end">
                             <span className="text-xs font-bold text-emerald-400">+${r.commission.toFixed(2)}</span>
                             <span className="text-[10px] text-zinc-600 uppercase">Paid</span>
                           </div>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Pending</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No matches found" />
                )}
              </div>
            </div>
            
            {/* <button className="mt-8 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all border border-zinc-700/50">
                Download Report
            </button> */}
          </section>

        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, isLast }: any) {
  return (
    <div className={`bg-zinc-900/20 border border-zinc-800/50 p-5 rounded-3xl hover:border-zinc-700 transition-colors`}>
      <div className="flex flex-col gap-4">
        <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">{title}</p>
          <p className="text-xl font-bold mt-0.5 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800/50 rounded-2xl">
      <Inbox className="w-8 h-8 mb-3 opacity-20" />
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}