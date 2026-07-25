"use client";

import { useEffect, useState } from "react";
import { 
  Check, 
  X, 
  Search, 
  ExternalLink, 
  Globe, 
  Mail, 
  Calendar,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Shadcn utility for tailwind classes

interface Partner {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  partnerProfile: {
    companyName: string;
    website?: string;
    country?: string;
    appliedAt: string;
    isApproved: boolean;
  };
}

type FilterStatus = "pending" | "approved";

export default function AdminPartnerReviewDashboard({admin}: {admin: any}) {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, countryCount: 0 });

  useEffect(() => {
    fetchPartners();
  }, [activeTab]); // Refetch when switching tabs

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      // We use the activeTab to decide which endpoint to hit
      const endpoint = activeTab === "pending" ? "/api/admin/partners/pending" : "/api/admin/partners/approve";

      const [partnersRes, statsRes] = await Promise.all([
        fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/partners/stats", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const partnersData = await partnersRes.json();
      const statsData = await statsRes.json();

      setPartners(partnersData.partners || []);
      
      if (statsData.stats) {
        setStats({
          total: statsData.stats.total,
          pending: statsData.stats.pending,
          approved: statsData.stats.approved,
          countryCount: statsData.stats.countryCount
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to refresh dashboard metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: "approve" | "reject" | "revoke") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/partners/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: `Action Successful`,
        description: `Partner has been ${action}ed.`,
      });

      fetchPartners();
    } catch {
      toast({
        title: "Action Failed",
        variant: "destructive",
      });
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.partnerProfile.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2 px-3 py-1 text-primary bg-primary/10 border-none uppercase tracking-wider text-[10px] font-bold">
            Admin Management
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Partner Relations</h1>
          <p className="text-slate-500 mt-1">Manage, verify, and monitor your global partner network.</p>
        </div>
        <Button onClick={fetchPartners} variant="outline" size="sm" className="hidden md:flex items-center gap-2 shadow-sm border-slate-200">
          Refresh Data
        </Button>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Partners" value={stats.total} icon={<Users className="w-5 h-5" />} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="Pending Review" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="text-amber-600" bgColor="bg-amber-50" />
        <StatCard title="Verified Partners" value={stats.approved} icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Active Regions" value={stats.countryCount} icon={<Globe className="w-5 h-5" />} color="text-indigo-600" bgColor="bg-indigo-50" />
      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Pending {stats.pending > 0 && `(${stats.pending})`}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={cn(
              "flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === "approved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Approved
          </button>
        </div>

        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search partners..."
            className="pl-10 bg-white border-slate-200 focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Main Table Area */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-white/50 py-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {activeTab === "pending" ? "Incoming Applications" : "Verified Network"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <LoadingTable />
          ) : filteredPartners.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-400 bg-slate-50/50 font-bold">
                    <th className="px-6 py-4">Partner</th>
                    <th className="px-6 py-4">Company Details</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">{activeTab === "pending" ? "Applied" : "Status"}</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartners.map((partner) => (
                    <tr key={partner._id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm font-bold">
                            <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600">
                              {partner.firstName[0]}{partner.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-none">
                              {partner.firstName} {partner.lastName}
                            </span>
                            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {partner.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm font-semibold text-slate-700">
                            <Building2 className="w-3.5 h-3.5 mr-2 text-primary/60" />
                            {partner.partnerProfile.companyName}
                          </div>
                          {partner.partnerProfile.website && (
                            <a href={partner.partnerProfile.website} target="_blank" className="text-[11px] text-blue-500 hover:underline flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1" /> Visit
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 font-medium italic">
                          <Globe className="w-3 h-3 mr-1.5 opacity-70" />
                          {partner.partnerProfile.country || "Global"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "pending" ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                            {new Date(partner.partnerProfile.appliedAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                          {activeTab === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:bg-rose-50"
                                onClick={() => handleAction(partner._id, "reject")}
                              >
                                <X className="w-4 h-4 mr-1" /> Decline
                              </Button>
                              <Button
                                size="sm"
                                className="bg-slate-900 hover:bg-emerald-600 transition-colors"
                                onClick={() => handleAction(partner._id, "approve")}
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleAction(partner._id, "revoke")}
                            >
                              <UserX className="w-4 h-4 mr-1" /> Revoke Access
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState tab={activeTab} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color, bgColor }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-3xl font-black text-slate-900 tabular-nums">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-2xl ${bgColor} ${color} transition-transform group-hover:scale-110 z-10`}>
          {icon}
        </div>
      </CardContent>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${bgColor} opacity-10 group-hover:opacity-20 transition-opacity`} />
    </Card>
  );
}

function EmptyState({ tab }: { tab: FilterStatus }) {
  return (
    <div className="py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
        {tab === "pending" ? <TrendingUp className="w-8 h-8" /> : <Users className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900">
        {tab === "pending" ? "All Caught Up!" : "No Verified Partners"}
      </h3>
      <p className="text-slate-500 max-w-xs mx-auto mt-1">
        {tab === "pending" 
          ? "There are no new applications waiting for review." 
          : "You haven't approved any partners yet."}
      </p>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="p-6 space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-9 w-32 ml-auto" />
        </div>
      ))}
    </div>
  );
}