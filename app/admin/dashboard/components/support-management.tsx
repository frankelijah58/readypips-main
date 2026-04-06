'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Headphones,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SupportRow = {
  _id: string;
  ticketNumber: string;
  name: string;
  email: string;
  phoneNumber: string;
  queryType: string;
  queryTypeLabel: string;
  description: string;
  status: string;
  staffEmailSent?: boolean;
  userEmailSent?: boolean;
  emailError?: string | null;
  createdAt: string;
};

export default function SupportManagement({ admin: _admin }: { admin: any }) {
  const [items, setItems] = useState<SupportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
      });
      const res = await fetch(`/api/admin/support?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setItems(data.requests || []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 w-fit">
              Read only
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Headphones className="w-9 h-9 text-[#8C57FF]" />
              Support inbox
            </h1>
            <p className="text-white/55 text-sm max-w-xl">
              Tickets submitted from the public support page are stored in{' '}
              <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">support_requests</code>
              . This view is display-only.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <Input
                placeholder="Search tickets, email, message…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-11 bg-[#18181b] border-white/10 text-white placeholder:text-white/35"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchList()}
              className="h-11 border-white/10 bg-[#18181b] text-white hover:bg-white/5"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </header>

        <p className="text-sm text-white/40">
          {totalCount} ticket{totalCount !== 1 ? 's' : ''} total
        </p>

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 border-2 border-[#8C57FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card className="bg-[#18181b] border-white/10 p-12 text-center text-white/50">
            No support tickets found.
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((row) => {
              const open = expandedId === row._id;
              return (
                <Card
                  key={row._id}
                  className="bg-[#18181b] border-white/10 overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full text-left p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedId(open ? null : row._id)}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-[#8C57FF] font-semibold">
                          {row.ticketNumber}
                        </span>
                        <Badge variant="secondary" className="bg-white/5 text-white/80 text-xs">
                          {row.queryTypeLabel}
                        </Badge>
                        <span className="text-xs text-white/35">
                          {new Date(row.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white font-medium truncate">{row.name}</p>
                      <p className="text-sm text-white/45 truncate">{row.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50 shrink-0">
                      <span className="hidden sm:flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        {row.email}
                      </span>
                      {open ? (
                        <ChevronUp className="w-5 h-5 text-white/40" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                  </button>
                  {open && (
                    <div className="px-4 md:px-5 pb-5 pt-0 border-t border-white/5 space-y-4 text-sm">
                      <div className="grid sm:grid-cols-2 gap-3 pt-4">
                        <div className="flex items-start gap-2 text-white/70">
                          <Mail className="w-4 h-4 mt-0.5 shrink-0 text-[#8C57FF]" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-white/35">Email</p>
                            <a
                              href={`mailto:${row.email}`}
                              className="text-[#16B1FF] hover:underline break-all"
                            >
                              {row.email}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-white/70">
                          <Phone className="w-4 h-4 mt-0.5 shrink-0 text-[#8C57FF]" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-white/35">Phone</p>
                            <p>{row.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-white/70">
                          <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-[#8C57FF]" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-white/35">
                              Submitted
                            </p>
                            <p>{new Date(row.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-white/70">
                          <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-[#8C57FF]" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-white/35">
                              Notifications
                            </p>
                            <p>
                              Staff email: {row.staffEmailSent ? 'sent' : 'not sent'}
                              {' · '}
                              User email: {row.userEmailSent ? 'sent' : 'not sent'}
                            </p>
                            {row.emailError ? (
                              <p className="text-amber-400/90 text-xs mt-1">{row.emailError}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">
                          Full message
                        </p>
                        <p className="text-white/85 whitespace-pre-wrap rounded-lg bg-black/25 border border-white/5 p-4">
                          {row.description}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-white/10 bg-[#18181b] text-white"
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-white/50">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="border-white/10 bg-[#18181b] text-white"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
