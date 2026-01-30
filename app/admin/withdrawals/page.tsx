"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  User, 
  Search, 
  Filter,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "denied">("pending");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, status: "approved" | "denied") => {
    const confirmMessage = `Are you sure you want to ${status} this request?`;
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${requestId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Action failed");
      
      toast.success(`Request ${status} successfully`);
      setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredRequests = requests.filter(r => r.status === filter);

  if (loading) {
    return <div className="h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Withdrawal Requests</h1>
            <p className="text-zinc-500 text-sm mt-1">Review and process partner payouts (6% fee auto-applied)</p>
          </div>
          
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            {(["pending", "approved", "denied"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  filter === s ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500 text-[10px] uppercase font-bold">Pending Volume</p>
            <p className="text-2xl font-black text-white">
              ${requests.filter(r => r.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500 text-[10px] uppercase font-bold">Total Fees (6%)</p>
            <p className="text-2xl font-black text-indigo-400">
              ${requests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + (curr.amount * 0.06), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-zinc-500 text-[10px] uppercase font-bold">Requests Count</p>
            <p className="text-2xl font-black text-zinc-400">{filteredRequests.length}</p>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((req) => (
              <div key={req._id} className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-zinc-700 transition-all">
                
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-200">{req.partnerEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-zinc-500">ID: {req._id.slice(-8)}</span>
                      <span className="text-[10px] text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 px-8 border-x border-zinc-800/50 w-full md:w-auto">
                  <div className="text-center">
                    <p className="text-[9px] uppercase font-bold text-zinc-600 mb-1">Gross</p>
                    <p className="text-sm font-mono font-bold">${req.amount.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase font-bold text-zinc-600 mb-1">Fee (6%)</p>
                    <p className="text-sm font-mono font-bold text-red-400">-${(req.amount * 0.06).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase font-bold text-zinc-600 mb-1">Net Payout</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">${(req.amount * 0.94).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {req.status === "pending" ? (
                    <>
                      <button 
                        onClick={() => handleAction(req._id, "denied")}
                        className="flex-1 md:flex-none p-2.5 rounded-xl border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 text-zinc-500 hover:text-red-500 transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAction(req._id, "approved")}
                        className="flex-1 md:flex-none flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                    </>
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                      req.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{req.status}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
              <Clock className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No {filter} requests found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}