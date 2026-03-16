"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Search, Mail, Filter, TrendingUp, DollarSign, ExternalLink, ShieldCheck, UserMinus } from "lucide-react";
import { toast } from "sonner";

export default function PartnerDrillDown() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "free">("paid");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/partners/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        setData(result);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Combined Search and Payment Filtering logic
  const filteredReferrals = useMemo(() => {
    if (!data?.referrals) return [];
    
    return data.referrals.filter((u: any) => {
      const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPayment = 
        paymentFilter === "all" ? true :
        paymentFilter === "paid" ? u.isPaid === true :
        u.isPaid === false;

      return matchesSearch && matchesPayment;
    });
  }, [searchQuery, paymentFilter, data]);

  const totalCommission = useMemo(() => {
    return data?.referrals?.reduce((acc: number, curr: any) => acc + (curr.commissionGenerated || 0), 0) || 0;
  }, [data]);

  if (loading) {
    return (
      <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to Partners
        </button>

        {/* Partner Hero Profile */}
        <section className="relative overflow-hidden bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem]">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User className="w-32 h-32" />
          </div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{data.partner?.email}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                      ID: {data.partner?._id?.slice(-8)}
                    </span>
                    <span className="text-xs font-mono text-indigo-400 font-bold">
                      CODE: {data.partner?.referralCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-12 border-l border-zinc-800 pl-12">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Affiliates</p>
                <p className="text-4xl font-black text-white">{data.referrals?.length || 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Total Earned</p>
                <p className="text-4xl font-black text-emerald-400">${totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* List Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-xl font-bold">Referral Network</h2>
            
            {/* Payment Filter Segmented Control */}
            <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 w-fit">
              {(['all', 'paid', 'free'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPaymentFilter(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    paymentFilter === type 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Referrals Table-Style List */}
        <div className="space-y-3">
          {filteredReferrals.length > 0 ? (
            filteredReferrals.map((user: any) => (
              <div 
                key={user._id} 
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/20 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    user.isPaid 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                  }`}>
                    {user.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-200">{user.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 italic">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className={`text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 ${user.isPaid ? 'text-emerald-500' : 'text-zinc-600'}`}>
                            {user.isPaid ? (
                              <><ShieldCheck className="w-3 h-3" /> Premium Subscription</>
                            ) : (
                              <><UserMinus className="w-3 h-3" /> Free Tier</>
                            )}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-12 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-tighter mb-0.5">Value Generated</p>
                    <p className={`text-lg font-mono font-bold ${user.commissionGenerated > 0 ? 'text-emerald-400' : 'text-zinc-700'}`}>
                      ${user.commissionGenerated.toFixed(2)}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/10 border-2 border-dashed border-zinc-800/50 rounded-[2rem]">
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                 <Filter className="w-6 h-6 text-zinc-700" />
              </div>
              <p className="text-zinc-500 font-medium">No {paymentFilter !== 'all' ? paymentFilter : ''} results match your criteria</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setPaymentFilter("all");
                }}
                className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}