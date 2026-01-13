"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function PartnerDrillDown() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const totalPartnerRevenue = data.referrals.reduce((acc: number, curr: any) => acc + curr.commissionGenerated, 0);

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

  if (loading) return <div className="p-10 text-zinc-500">Loading connections...</div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold">{data.partner.email}</h1>
            <p className="text-indigo-400 font-mono text-sm">Code: {data.partner.referralCode}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Total Referred</p>
            <p className="text-3xl font-black">{data.referrals.length}</p>
          </div>
        </div>

        {/* Referrals List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-zinc-500" />
            Referred Users ({data.referrals.length})
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {data.referrals.length > 0 ? (
              data.referrals.map((user: any) => (
                <div 
                      key={user._id} 
                      className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.email}</p>
                          <p className="text-[10px] text-zinc-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        {/* Status Indicator */}
                        <div className="hidden md:block">
                          {user.isPaid ? (
                            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded uppercase font-bold">
                              Free
                            </span>
                          )}
                        </div>

                        {/* Financials */}
                        <div className="text-right min-w-[100px]">
                          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Commission</p>
                          <p className={`text-sm font-mono ${user.commissionGenerated > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            ${user.commissionGenerated.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                // <div 
                //   key={user._id} 
                //   className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all"
                // >
                //   <div className="flex items-center gap-4">
                //     <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                //       <Mail className="w-4 h-4 text-zinc-400" />
                //     </div>
                //     <div>
                //       <p className="font-medium text-sm">{user.email}</p>
                //       <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                //         <span className="flex items-center gap-1">
                //           <Calendar className="w-3 h-3" /> 
                //           Joined {new Date(user.createdAt).toLocaleDateString()}
                //         </span>
                //         <span className="flex items-center gap-1">
                //           <Clock className="w-3 h-3" /> 
                //           ID: {user._id.substring(0, 8)}...
                //         </span>
                //       </div>
                //     </div>
                //   </div>

                //   {/* Optional: Check if user is active/paid */}
                //   <div>
                //     {user.hasPaid ? (
                //       <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-1 rounded-full">
                //         <CheckCircle2 className="w-3 h-3" /> Active Payer
                //       </span>
                //     ) : (
                //       <span className="text-zinc-600 text-xs px-2 py-1 bg-zinc-800/50 rounded-full">
                //         Free User
                //       </span>
                //     )}
                //   </div>
                // </div>
              ))
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                <p className="text-zinc-500 text-sm">This partner hasn't referred anyone yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}