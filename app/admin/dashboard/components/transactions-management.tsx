'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 15;

export default function TransactionsManagement({
    admin,
    headerSearch,
    onHeaderSearchChange,
}: {
    admin: any;
    headerSearch: string;
    onHeaderSearchChange: (value: string) => void;
}) {
    const { toast } = useToast();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    }), []);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/admin/transactions?page=${page}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(
                    headerSearch,
                )}`,
                { headers: authHeaders() },
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Unable to load transactions');
            }
            setPayments(data.payments ?? []);
            setTotalPages(data.totalPages ?? 1);
        } catch (error: any) {
            toast({
                title: 'Error loading transactions',
                description: error?.message || 'Could not fetch transactions',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [authHeaders, headerSearch, page, toast]);

    useEffect(() => {
        const timer = setTimeout(fetchPayments, 300);
        return () => clearTimeout(timer);
    }, [fetchPayments]);

    useEffect(() => {
        setPage(1);
    }, [headerSearch]);

    const formatDate = (value: string | Date | undefined) => {
        if (!value) return '—';
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6 text-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Transactions</h2>
                    <p className="text-sm text-white/60 mt-1">View all payment intents across providers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <input
                            className="pl-4 pr-4 py-2 bg-[#18181b] border border-white/10 rounded-xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#8C57FF] text-white placeholder:text-white/30 w-full md:w-80"
                            placeholder="Search by email, plan, mode..."
                            value={headerSearch}
                            onChange={(e) => onHeaderSearchChange(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="bg-[#18181b] border-white/10 text-white hover:bg-[#18181b]/5"
                        onClick={fetchPayments}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/[0.04] bg-[#18181b] shadow-lg">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-[#121212]/70 text-left text-xs uppercase tracking-[0.2em] text-white/50">
                        <tr>
                            <th className="px-4 py-3">Subscriber (Email)</th>
                            <th className="px-4 py-3">Plan</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Payment Mode</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {payments.length > 0 ? (
                            payments.map((payment) => (
                                <tr key={payment._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-4 align-top text-white/80 break-words max-w-xs">
                                        {payment.email || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-4 align-top text-white/80">{payment.planId || '—'}</td>
                                    <td className="px-4 py-4 align-top text-white/80">{formatDate(payment.createdAt)}</td>
                                    <td className="px-4 py-4 align-top text-white/80">{payment.paymentChannel || payment.provider || '—'}</td>
                                    <td className="px-4 py-4 align-top">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${String(payment.status || 'pending').toLowerCase().includes('pending')
                                                    ? 'bg-yellow-500/10 text-yellow-300'
                                                    : String(payment.status || '').toLowerCase().includes('paid') || String(payment.status || '').toLowerCase().includes('success')
                                                        ? 'bg-emerald-500/10 text-emerald-300'
                                                        : String(payment.status || '').toLowerCase().includes('failed') || String(payment.status || '').toLowerCase().includes('decline')
                                                            ? 'bg-rose-500/10 text-rose-300'
                                                            : 'bg-slate-500/10 text-slate-200'
                                                }`}
                                        >
                                            {payment.status || 'pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-white/50">
                                    {loading ? 'Loading transactions...' : 'No transactions found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/50">
                    Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="h-9 px-3 text-white/80 hover:text-white"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-9 px-3 text-white/80 hover:text-white"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
