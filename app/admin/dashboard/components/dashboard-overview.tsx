'use client';

import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/* ─── Types ─── */

interface DashboardStats {
  totalUsers: number;
  active: number;
  expired: number;
  trial: number;
  pending: number;
  systemUptime: string;
  toolAccessMetrics: number;
  revenue: {
    total: number;
    weekly: number;
    daily: number;
  };
}

interface PlanRevenue {
  name: string;
  revenue: string;
  percentage: number;
  count: number;
}

interface RecentSubscription {
  _id: string;
  userName: string;
  userEmail: string;
  plan: string;
  price: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

/* ─── Colour constants ─── */

const COLORS = {
  purple: '#8C57FF',
  green: '#56CA00',
  blue: '#16B1FF',
  orange: '#FFB400',
  red: '#FF4C51',
  cyan: '#00D4AA',
};

const PIE_COLORS = [COLORS.purple, COLORS.green, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];

/* ─── Custom Tooltip ─── */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#3B3755] border border-white/10 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

export default function DashboardOverview({
  admin,
  headerSearch,
}: {
  admin: any;
  headerSearch: string;
}) {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [planRevenue, setPlanRevenue] = useState<PlanRevenue[]>([]);
  const [recentSubs, setRecentSubs] = useState<RecentSubscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const LIVE_REFRESH_MS = 15000;

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const nonce = Date.now();
      const [statsRes, usersRes, plansRes, subsRes] = await Promise.all([
        fetch(`/api/admin/dashboard/stats?t=${nonce}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`/api/admin/dashboard/recent-users?t=${nonce}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`/api/admin/dashboard/plan-revenue?t=${nonce}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch(`/api/admin/dashboard/recent-subscriptions?t=${nonce}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ]);

      if (statsRes.ok) {
        const { stats } = await statsRes.json();
        setStats(stats);
      } else if (statsRes.status === 401 || statsRes.status === 403) {
        toast({
          title: 'Access',
          description: 'Dashboard metrics could not be loaded. Sign in again or refresh.',
          variant: 'destructive',
        });
      }

      if (usersRes.ok) {
        const { users } = await usersRes.json();
        setRecentUsers(users);
      } else {
        setRecentUsers([]);
      }

      if (plansRes.ok) {
        const { plans } = await plansRes.json();
        setPlanRevenue(plans);
      } else {
        setPlanRevenue([]);
      }

      if (subsRes.ok) {
        const { subscriptions } = await subsRes.json();
        setRecentSubs(subscriptions || []);
      } else {
        setRecentSubs([]);
      }
    } catch (error) {
      toast({ title: 'Dashboard Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = window.setInterval(() => {
      fetchDashboardData();
    }, LIVE_REFRESH_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  /* ─── Derived chart data ─── */

  const subscriptionPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Active', value: stats.active, color: COLORS.green },
      { name: 'Trial', value: stats.trial, color: COLORS.blue },
      { name: 'Expired', value: stats.expired, color: COLORS.red },
      { name: 'Pending', value: stats.pending, color: COLORS.orange },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const revenueBarData = useMemo(() => {
    if (!planRevenue.length) return [];
    return planRevenue.map((plan, i) => ({
      name: plan.name.length > 12 ? plan.name.slice(0, 12) + '…' : plan.name,
      revenue: parseFloat(plan.revenue.replace(/[^0-9.]/g, '')) || 0,
      subscribers: plan.count,
      fill: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [planRevenue]);

  const revenueAreaData = useMemo(() => {
    if (!stats) return [];
    // Build a simple daily/weekly/total comparison for the area chart
    return [
      { period: 'Today', revenue: stats.revenue.daily },
      { period: 'This Week', revenue: stats.revenue.weekly },
      { period: 'All Time', revenue: stats.revenue.total },
    ];
  }, [stats]);

  const filteredRecentSubs = useMemo(() => {
    const needle = headerSearch.trim().toLowerCase();
    if (!needle) return recentSubs;
    return recentSubs.filter((sub) => {
      const name = (sub.userName || '').toLowerCase();
      const email = (sub.userEmail || '').toLowerCase();
      const plan = (sub.plan || '').toLowerCase();
      const status = (sub.status || '').toLowerCase();
      return (
        name.includes(needle) ||
        email.includes(needle) ||
        plan.includes(needle) ||
        status.includes(needle)
      );
    });
  }, [recentSubs, headerSearch]);

  const filteredRecentUsers = useMemo(() => {
    const needle = headerSearch.trim().toLowerCase();
    if (!needle) return recentUsers;
    return recentUsers.filter((user) => {
      const name = (user.userName || '').toLowerCase();
      const email = (user.userEmail || '').toLowerCase();
      const plan = (user.planType || '').toLowerCase();
      return name.includes(needle) || email.includes(needle) || plan.includes(needle);
    });
  }, [recentUsers, headerSearch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#8C57FF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Top 4 Distinct Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10">
            <p className="text-[#d0d4f1]/60 text-sm font-medium mb-3">Total Users</p>
            <h3 className="text-3xl font-bold text-white mb-2">{stats?.totalUsers || 0}</h3>
            <p className="text-[#d0d4f1]/40 text-xs">{stats?.active || 0} active</p>
          </div>
          <Users className="absolute -right-4 -bottom-4 w-28 h-28 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
        </div>

        {/* Revenue Card */}
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10">
            <p className="text-[#d0d4f1]/60 text-sm font-medium mb-3">Revenue</p>
            <h3 className="text-3xl font-bold text-white mb-2">
              KES {stats?.revenue?.total?.toLocaleString() || 0}
            </h3>
            <p className="text-[#d0d4f1]/40 text-xs">
              Weekly: KES {stats?.revenue?.weekly?.toLocaleString() || 0}
            </p>
          </div>
          <DollarSign className="absolute -right-4 -bottom-4 w-28 h-28 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
        </div>

        {/* Pending Payments Card */}
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10">
            <p className="text-[#d0d4f1]/60 text-sm font-medium mb-3">Pending Payments</p>
            <h3 className="text-3xl font-bold text-white mb-2">{stats?.pending || 0}</h3>
            <p className="text-[#d0d4f1]/40 text-xs">Awaiting completion</p>
          </div>
          <Clock className="absolute -right-4 -bottom-4 w-28 h-28 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
        </div>

        {/* System Uptime Card */}
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#d0d4f1]/60 text-sm font-medium">System Uptime</p>
              <button onClick={handleRefresh} disabled={refreshing} className="text-white/40 hover:text-white/80 transition-colors">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats?.systemUptime || '...'}</h3>
            <p className="text-[#d0d4f1]/40 text-xs">Real-time metrics</p>
          </div>
          <Activity className="absolute -right-4 -bottom-4 w-28 h-28 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
        </div>
      </div>

      {/* Row 2: Subscription Pie + Revenue by Plan Bar + Mini Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Subscription Distribution Pie Chart */}
        <div className="md:col-span-4">
          <div className="bg-[#18181b] rounded-xl p-6 h-full border border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#8C57FF]" />
                <h6 className="text-lg font-semibold text-white">Subscription Mix</h6>
              </div>
            </div>
            {subscriptionPieData.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {subscriptionPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {subscriptionPieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-white/60 text-xs">{entry.name}</span>
                      <span className="text-white text-xs font-semibold ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-white/30">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="text-sm">No subscription data</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Plan Bar Chart */}
        <div className="md:col-span-4">
          <div className="bg-[#18181b] rounded-xl p-6 h-full border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#56CA00]" />
                <h6 className="text-lg font-semibold text-white">Revenue by Plan</h6>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-2xl font-bold text-white">
                KES {stats?.revenue?.total?.toLocaleString() || '0'}
              </span>
              {stats?.revenue?.daily ? (
                <span className="text-xs font-medium text-[#56CA00] bg-[#56CA00]/10 px-2 py-0.5 rounded flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  +KES {stats.revenue.daily.toLocaleString()} today
                </span>
              ) : null}
            </div>
            {revenueBarData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueBarData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'rgba(208,212,241,0.4)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(208,212,241,0.4)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Revenue (KES)" radius={[6, 6, 0, 0]}>
                      {revenueBarData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-white/30">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="text-sm">No revenue data</p>
              </div>
            )}
          </div>
        </div>

        {/* Mini Stat Cards */}
        <div className="md:col-span-4">
          <div className="grid grid-cols-2 gap-5 h-full">
            <MiniStatCard
              title="Daily Revenue"
              value={`KES ${stats?.revenue?.daily?.toLocaleString() || '0'}`}
              subtitle="Today"
              color={COLORS.purple}
              icon={TrendingUp}
              trendUp
            />
            <MiniStatCard
              title="Weekly"
              value={`KES ${stats?.revenue?.weekly?.toLocaleString() || '0'}`}
              subtitle="This Week"
              color={COLORS.green}
              icon={BarChart3}
              trendUp
            />
            <MiniStatCard
              title="Trials"
              value={String(stats?.trial || 0)}
              subtitle="Active Trials"
              color={COLORS.orange}
              icon={Clock}
            />
            <MiniStatCard
              title="Expired"
              value={String(stats?.expired || 0)}
              subtitle="Need Renewal"
              color={COLORS.red}
              icon={AlertCircle}
              trendDown
            />
          </div>
        </div>
      </div>

      {/* Row 3: Revenue Trend Area Chart */}
      <div className="bg-[#18181b] rounded-xl p-6 border border-white/[0.04]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#8C57FF]" />
            <h6 className="text-lg font-semibold text-white">Revenue Overview</h6>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#8C57FF]" />
              <span className="text-white/50">Revenue</span>
            </div>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueAreaData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8C57FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8C57FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="period"
                tick={{ fill: 'rgba(208,212,241,0.4)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(208,212,241,0.4)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue (KES)"
                stroke="#8C57FF"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={{ fill: '#8C57FF', r: 5, strokeWidth: 2, stroke: '#312D4B' }}
                activeDot={{ r: 7, fill: '#8C57FF', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Recent Subscriptions Table */}
      {recentSubs.length > 0 && (
        <div className="bg-[#18181b] rounded-xl overflow-hidden border border-white/[0.04]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#16B1FF]" />
              <h6 className="text-lg font-semibold text-white">Recent Subscriptions</h6>
            </div>
            <span className="text-xs text-white/30 bg-[#18181b]/5 px-2.5 py-1 rounded-md">
              {headerSearch.trim()
                ? `${filteredRecentSubs.length} of ${recentSubs.length}`
                : `${recentSubs.length} latest`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentSubs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#d0d4f1]/40">
                      No subscriptions match your search
                    </td>
                  </tr>
                ) : (
                  filteredRecentSubs.map((sub) => (
                  <tr key={sub._id} className="border-b border-white/5 hover:bg-[#18181b]/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#8C57FF]/20 flex items-center justify-center text-[#8C57FF] text-sm font-bold">
                          {sub.userName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className="text-white text-sm font-medium block">{sub.userName || 'Unknown'}</span>
                          <span className="text-[#d0d4f1]/40 text-xs">{sub.userEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/80 text-sm">{sub.plan || '—'}</td>
                    <td className="px-6 py-4 text-white/80 text-sm font-medium">
                      {sub.price ? `KES ${sub.price.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-[#d0d4f1]/50 text-sm">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 5: Recent Users Table */}
      <div className="bg-[#18181b] rounded-xl overflow-hidden border border-white/[0.04]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8C57FF]" />
            <h6 className="text-lg font-semibold text-white">Recent Users</h6>
          </div>
          <span className="text-xs text-white/30 bg-[#18181b]/5 px-2.5 py-1 rounded-md">
            {headerSearch.trim()
              ? `${filteredRecentUsers.length} of ${recentUsers.length}`
              : `${recentUsers.length} latest`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#d0d4f1]/50 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentUsers.length > 0 ? (
                filteredRecentUsers.map((user) => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-[#18181b]/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#8C57FF]/20 flex items-center justify-center text-[#8C57FF] text-sm font-bold">
                          {user.userName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-white text-sm font-medium">{user.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#d0d4f1]/60 text-sm">{user.userEmail}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-md text-xs font-medium ${
                          user.planType === 'Premium'
                            ? 'bg-[#8C57FF]/15 text-[#8C57FF]'
                            : user.planType === 'Free Trial'
                            ? 'bg-[#56CA00]/15 text-[#56CA00]'
                            : 'bg-[#18181b]/10 text-[#d0d4f1]/70'
                        }`}
                      >
                        {user.planType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#d0d4f1]/50 text-sm">
                      {new Date(user.joinedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#d0d4f1]/40">
                    {recentUsers.length === 0
                      ? 'No recent users'
                      : 'No users match your search'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatItem({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  trend,
  trendUp,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string;
  trend?: number;
  trendUp?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-[#d0d4f1]/60 text-sm">{title}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-white text-lg font-bold">{value}</p>
          {trend !== undefined && trend > 0 && (
            <span className={`text-[10px] font-bold flex items-center ${trendUp ? 'text-[#56CA00]' : 'text-[#FF4C51]'}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({
  title,
  value,
  subtitle,
  color,
  icon: Icon,
  trendDown,
  trendUp,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: any;
  trendDown?: boolean;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-[#18181b] rounded-xl p-5 flex flex-col justify-between border border-white/[0.04] hover:border-white/[0.08] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trendDown && (
          <div className="flex items-center gap-0.5 text-[#FF4C51]">
            <TrendingDown className="w-4 h-4" />
          </div>
        )}
        {trendUp && (
          <div className="flex items-center gap-0.5 text-[#56CA00]">
            <TrendingUp className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <p className="text-white text-xl font-bold">{value}</p>
        <p className="text-[#d0d4f1]/50 text-xs mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-[#56CA00]/15', text: 'text-[#56CA00]', label: 'Active' },
    trial: { bg: 'bg-[#16B1FF]/15', text: 'text-[#16B1FF]', label: 'Trial' },
    expired: { bg: 'bg-[#FF4C51]/15', text: 'text-[#FF4C51]', label: 'Expired' },
    pending: { bg: 'bg-[#FFB400]/15', text: 'text-[#FFB400]', label: 'Pending' },
    cancelled: { bg: 'bg-[#18181b]/10', text: 'text-[#d0d4f1]/60', label: 'Cancelled' },
  };
  const c = config[status?.toLowerCase()] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${c.bg} ${c.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
      {c.label}
    </span>
  );
}

