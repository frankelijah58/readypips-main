"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Copy,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { Navigation } from "@/components/navigation";

type FilterType = "all" | "paid" | "pending";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const endpoint =
          user.role === "affiliate"
            ? "/api/affiliate/dashboard"
            : "/api/partner/dashboard";

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
    toast.success("Referral link copied");
  };

  const { stats, revenueChart, referrals = [], referralCode } = dashboard || {};

  /* 🔹 Filter referrals */
  const filteredReferrals = useMemo(() => {
    if (filter === "paid") return referrals.filter((r: any) => r.hasPaid);
    if (filter === "pending") return referrals.filter((r: any) => !r.hasPaid);
    return referrals;
  }, [filter, referrals]);

  if (loading) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm mt-4 uppercase tracking-widest">
          Loading Analytics
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-10">
      <Navigation />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-zinc-500 text-sm">
              Overview for <span className="text-indigo-400">{user?.email}</span>
            </p>
          </div>

          <div
            onClick={copyToClipboard}
            className="cursor-pointer bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-4 hover:border-indigo-500/50"
          >
            <div>
              <p className="text-[10px] uppercase text-zinc-500 font-bold">
                Referral Link
              </p>
              <p className="text-xs font-mono text-zinc-300 truncate max-w-xs">
                {referralCode}
              </p>
            </div>
            <Copy className="w-4 h-4 text-zinc-400" />
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <StatCard
            title="Total Revenue"
            value={`$${stats?.totalRevenue?.toFixed(2) || "0.00"}`}
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            title="Total Referrals"
            value={stats?.totalReferrals || 0}
            icon={<Users className="w-5 h-5 text-blue-400" />}
          />
          <StatCard
            title="Paid Referrals"
            value={stats?.paidReferrals || 0}
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            title="Pending Referrals"
            value={stats?.pendingReferrals || 0}
            icon={<Users className="w-5 h-5 text-rose-400" />}
          />
          <StatCard
            title="Conversion Rate"
            value={stats?.conversionRate || "0%"}
            icon={<Zap className="w-5 h-5 text-amber-400" />}
          />
        </div>

        {/* Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Revenue Performance
            </h3>

            {revenueChart?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#818cf8"
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState label="No revenue yet" />
            )}
          </div>

          {/* Referral Activity */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Referral Activity</h3>

              <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg">
                {["all", "paid", "pending"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as FilterType)}
                    className={`px-3 py-1 text-xs rounded-md ${
                      filter === f
                        ? "bg-indigo-500 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {filteredReferrals.length ? (
              <div className="space-y-4">
                {filteredReferrals.slice(0, 6).map((r: any) => (
                  <div key={r._id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{`${r.firstName} ${r.lastName}`}</p>
                      {/* show a part of the email and not the whole email */}
                      <p className="text-xs text-zinc-500">
                        {r.email.length > 6
                          ? r.email.slice(0, 6) + "..."
                          : r.email}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-sm">
                        {r.hasPaid ? "Subscription Active" : "Signed Up"}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {r.hasPaid ? (
                      <span className="text-emerald-400 font-bold">
                        +${r.commission.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No referrals match this filter" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* UI helpers */

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-[250px] flex flex-col items-center justify-center text-zinc-600">
      <Inbox className="w-6 h-6 mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
