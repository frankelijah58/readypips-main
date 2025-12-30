"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Copy, DollarSign, TrendingUp, Users, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const endpoint =
          user?.role === "affiliate"
            ? "/api/affiliate/dashboard"
            : "/api/partner/dashboard";

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setDashboard(data);
      } catch (err: any) {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboard();
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dashboard.referralLink);
    toast.success("Referral link copied!");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  const { stats, chart, recentConversions } = dashboard;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back, {dashboard.user.firstName}.
          </p>
        </div>

        <div
          onClick={copyToClipboard}
          className="flex items-center gap-3 bg-white border px-4 py-2 rounded-lg cursor-pointer hover:border-blue-400"
        >
          <span className="font-mono text-sm text-slate-600">
            {dashboard.referralLink}
          </span>
          <Copy className="w-4 h-4" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          trend={stats.trend.revenue}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          trendColor="text-emerald-600"
        />
        <StatCard
          title="Active Referrals"
          value={stats.activeReferrals}
          trend={stats.trend.referrals}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          trendColor="text-blue-600"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          trend={stats.trend.conversion}
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          trendColor={
            stats.trend.conversion.startsWith("-")
              ? "text-red-500"
              : "text-emerald-600"
          }
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={0.3}
                  fill="#3b82f6"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border">
          <h3 className="text-lg font-semibold mb-4">Recent Conversions</h3>

          {recentConversions.length === 0 && (
            <p className="text-sm text-slate-500">No conversions yet</p>
          )}

          <div className="space-y-4">
            {recentConversions.map((c: any) => (
              <div key={c.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">New Signup</p>
                  <p className="text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-emerald-600 font-medium">
                  +${c.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, trendColor }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border">
      <div className="flex justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
        <span className={`text-sm font-medium ${trendColor}`}>
          {trend} <ArrowUpRight className="inline w-3 h-3" />
        </span>
      </div>
      <h3 className="text-slate-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
