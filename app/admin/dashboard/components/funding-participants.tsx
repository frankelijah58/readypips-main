'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, RefreshCw, ChevronLeft, ChevronRight, Trophy, DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function FundingParticipants({ admin, headerSearch, onHeaderSearchChange }: { admin: any; headerSearch: string; onHeaderSearchChange: (v: string) => void }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalParticipants: 0, totalRevenue: 0, paidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const searchParam = headerSearch ? `&search=${encodeURIComponent(headerSearch)}` : '';
      const res = await fetch(`/api/admin/funding/participants?page=${page}&limit=20${searchParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setStats(data.stats || { totalParticipants: 0, totalRevenue: 0, paidCount: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch funding participants:', err);
    } finally {
      setLoading(false);
    }
  }, [page, headerSearch]);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <p className="text-white/60 text-sm font-medium">Total Participants</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{stats.totalParticipants}</h3>
        </div>
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <p className="text-white/60 text-sm font-medium">Total Revenue (KES)</p>
          </div>
          <h3 className="text-3xl font-bold text-white">KES {stats.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <p className="text-white/60 text-sm font-medium">Paid</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{stats.paidCount}</h3>
        </div>
        <div className="bg-[#18181b] border border-white/[0.04] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <p className="text-white/60 text-sm font-medium">Pending</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{stats.totalParticipants - stats.paidCount}</h3>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#18181b]/5 rounded-md px-3 py-2 border border-white/10 focus-within:border-[#8C57FF] transition-all w-72">
          <Search className="w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search by email, phone..."
            value={headerSearch}
            onChange={(e) => onHeaderSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/30"
          />
        </div>
        <button onClick={fetchParticipants} className="p-2 rounded-md border border-white/10 text-white/60 hover:text-white/90 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#18181b] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left p-4 text-sm font-semibold text-white/60">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-white/60">Phone</th>
                <th className="text-left p-4 text-sm font-semibold text-white/60">Plan</th>
                <th className="text-right p-4 text-sm font-semibold text-white/60">Amount (KES)</th>
                <th className="text-center p-4 text-sm font-semibold text-white/60">Status</th>
                <th className="text-right p-4 text-sm font-semibold text-white/60">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/40">Loading...</td></tr>
              ) : participants.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/40">No participants yet</td></tr>
              ) : participants.map((p: any) => (
                <tr key={p._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white/80 text-sm">{p.email || '—'}</td>
                  <td className="p-4 text-white/80 text-sm">{p.phone || p.phoneNumber || '—'}</td>
                  <td className="p-4 text-white/80 text-sm">{p.planName || 'Starter Challenge'}</td>
                  <td className="p-4 text-right text-white/80 text-sm">KES {p.amountKes?.toLocaleString() || p.amount?.toLocaleString() || '—'}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${String(p.status || 'pending').includes('paid') || String(p.status || '').includes('success') ? 'bg-emerald-500/10 text-emerald-300' : String(p.status || '').includes('failed') ? 'bg-rose-500/10 text-rose-300' : 'bg-yellow-500/10 text-yellow-300'}`}>
                      {p.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-white/60 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">{total} total participants</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-md border border-white/10 text-white/60 hover:text-white/90 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-white/60">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-md border border-white/10 text-white/60 hover:text-white/90 disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}