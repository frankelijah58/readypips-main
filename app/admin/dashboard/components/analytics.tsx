'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  CreditCard,
  TrendingDown,
  Shield,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  subscriptionGrowth: number;
  revenueGrowth: number;
  churnRate: number;
  retentionRate: number;
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#3B3755] border border-white/10 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function Analytics({ admin }: { admin: any }) {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();

        const totalSubs = data.stats?.active + data.stats?.expired + data.stats?.trial || 0;
        const activeSubs = data.stats?.active || 0;
        const expiredSubs = data.stats?.expired || 0;

        const churnRate = totalSubs > 0 ? ((expiredSubs / totalSubs) * 100) : 0;
        const retentionRate = totalSubs > 0 ? (100 - churnRate) : 100;

        setAnalytics({
          subscriptionGrowth: 12,
          revenueGrowth: 8.5,
          churnRate,
          retentionRate,
          totalUsers: data.stats?.totalUsers || 0,
          activeUsers: data.stats?.active || 0,
          totalSubscriptions: totalSubs,
          activeSubscriptions: activeSubs,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#8C57FF] border-t-transparent"></div>
      </div>
    );
  }

  const summaryChartData = [
    { name: 'Total', value: analytics.totalSubscriptions, fill: '#8C57FF' },
    { name: 'Active', value: analytics.activeSubscriptions, fill: '#56CA00' },
    { name: 'Inactive', value: analytics.totalSubscriptions - analytics.activeSubscriptions, fill: '#FF4C51' },
  ];

  const userChartData = [
    { name: 'Total', value: analytics.totalUsers, fill: '#16B1FF' },
    { name: 'Active', value: analytics.activeUsers, fill: '#56CA00' },
    { name: 'Inactive', value: analytics.totalUsers - analytics.activeUsers, fill: '#FFB400' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Users"
          value={analytics.totalUsers.toString()}
          subtitle="All registered users"
          icon={Users}
          color="#16B1FF"
        />
        <MetricCard
          title="Active Subscriptions"
          value={analytics.activeSubscriptions.toString()}
          subtitle="Currently active"
          icon={CreditCard}
          color="#56CA00"
          trendUp
          trendValue={`${analytics.retentionRate.toFixed(0)}%`}
        />
        <MetricCard
          title="Churn Rate"
          value={`${analytics.churnRate.toFixed(1)}%`}
          subtitle="Expired subscriptions"
          icon={TrendingDown}
          color="#FF4C51"
          trendDown
        />
        <MetricCard
          title="Retention"
          value={`${analytics.retentionRate.toFixed(1)}%`}
          subtitle="This month"
          icon={Shield}
          color="#56CA00"
          trendUp
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#18181b] rounded-xl p-6 border border-white/[0.04]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#8C57FF]" />
            <h3 className="font-semibold text-white text-lg">Subscription Summary</h3>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(208,212,241,0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(208,212,241,0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            <SummaryRow label="Total Subscriptions" value={analytics.totalSubscriptions} color="text-white" />
            <SummaryRow label="Active Subscriptions" value={analytics.activeSubscriptions} color="text-[#56CA00]" />
            <SummaryRow label="Churn Rate" value={`${analytics.churnRate.toFixed(1)}%`} color="text-[#FF4C51]" />
            <SummaryRow label="Retention Rate" value={`${analytics.retentionRate.toFixed(1)}%`} color="text-[#56CA00]" />
          </div>
        </div>

        <div className="bg-[#18181b] rounded-xl p-6 border border-white/[0.04]">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#16B1FF]" />
            <h3 className="font-semibold text-white text-lg">User Summary</h3>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(208,212,241,0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(208,212,241,0.5)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            <SummaryRow label="Total Users" value={analytics.totalUsers} color="text-white" />
            <SummaryRow label="Active Users" value={analytics.activeUsers} color="text-[#56CA00]" />
            <SummaryRow label="Inactive Users" value={analytics.totalUsers - analytics.activeUsers} color="text-[#FFB400]" />
            <SummaryRow
              label="Active Rate"
              value={`${analytics.totalUsers > 0 ? ((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1) : '0'}%`}
              color="text-[#16B1FF]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trendUp,
  trendDown,
  trendValue,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: string;
  trendUp?: boolean;
  trendDown?: boolean;
  trendValue?: string;
}) {
  return (
    <div className="bg-[#18181b] rounded-xl p-5 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trendUp && (
          <div className="flex items-center gap-0.5 text-[#56CA00] text-xs font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
        {trendDown && (
          <div className="flex items-center gap-0.5 text-[#FF4C51] text-xs font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold mb-1`} style={{ color }}>{value}</p>
      <p className="text-sm text-[#d0d4f1]/50">{title}</p>
      <p className="text-xs text-[#d0d4f1]/30 mt-0.5">{subtitle}</p>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#d0d4f1]/60 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}

