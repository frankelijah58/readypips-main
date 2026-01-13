"use client";

import { useEffect, useState } from "react";
import { Users, ExternalLink, ShieldCheck, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Partner = {
  _id: string;
  email: string;
  createdAt: string;
  role: string;
  referralCode?: string;
  totalReferrals?: number;
};

export default function AdminPartnerView() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/partners", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = (await res.json()) as Partner[];
      setPartners(data || []);
    } catch (err) {
      toast.error("Unauthorized or server error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = partners.filter(p => 
    p.email.toLowerCase().includes(search.toLowerCase()) || 
    p.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-[#09090b] min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" /> Admin: Partner Management
            </h1>
            <p className="text-zinc-500">Manage all system affiliates and their performance.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search email or code..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Partner / Affiliate</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Ref Code</th>
                <th className="px-6 py-4 font-semibold text-center">Referrals</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium">{p.email}</p>
                    <p className="text-[10px] text-zinc-500">Joined {new Date(p.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      p.role === 'partner' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">{p.referralCode}</td>
                  <td className="px-6 py-4 text-center font-bold text-lg">{p.totalReferrals}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400"
                      onClick={() => router.push(`/admin/partner-dashbaord/${p._id}`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}