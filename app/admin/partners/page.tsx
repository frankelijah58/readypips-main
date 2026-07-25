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
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function AdminPartnerReviewDashboard() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/admin/partners/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setPartners(data.partners || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load partner applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: "approve" | "reject") => {
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
        title: `Partner ${action === "approve" ? "Approved" : "Rejected"}`,
        description: "The partner has been notified of your decision.",
      });

      fetchPartners();
    } catch {
      toast({
        title: "Action Failed",
        description: "Unable to process request",
        variant: "destructive",
      });
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.partnerProfile.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Partner Review</h1>
          <p className="text-slate-500">Manage and verify incoming partnership applications.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
          <UserCheck className="w-4 h-4" />
          <span className="text-sm font-semibold">{partners.length} Pending Requests</span>
        </div>
      </div>

      {/* Controls */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by company or email..."
          className="pl-10 max-w-md bg-white shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredPartners.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-sm font-medium text-slate-600">Partner Details</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-600">Company</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-600">Region</th>
                    <th className="px-6 py-4 text-sm font-medium text-slate-600">Applied Date</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-600">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartners.map((partner) => (
                    <tr key={partner._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                              {partner.firstName[0]}{partner.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900 leading-none">
                              {partner.firstName} {partner.lastName}
                            </p>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <Mail className="w-3 h-3 mr-1" />
                              {partner.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-700 flex items-center">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {partner.partnerProfile.companyName}
                          </p>
                          {partner.partnerProfile.website && (
                            <a 
                              href={partner.partnerProfile.website} 
                              target="_blank" 
                              className="text-xs text-blue-500 hover:underline flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Website
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-normal border-slate-200 bg-white">
                          <Globe className="w-3 h-3 mr-1 text-slate-400" />
                          {partner.partnerProfile.country || "Global"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <div className="flex items-center italic">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                          {new Date(partner.partnerProfile.appliedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-100 hover:bg-rose-50 hover:text-rose-700 h-8"
                            onClick={() => handleAction(partner._id, "reject")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-8"
                            onClick={() => handleAction(partner._id, "approve")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState isSearch={searchQuery.length > 0} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </div>
          <Skeleton className="h-8 w-[200px]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isSearch }: { isSearch: boolean }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
      <div className="bg-slate-50 p-6 rounded-full mb-4">
        <UserCheck className="w-12 h-12 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">
        {isSearch ? "No matching applications" : "All caught up!"}
      </h3>
      <p className="text-slate-500 max-w-sm mt-1">
        {isSearch 
          ? "We couldn't find any partners matching that search criteria." 
          : "There are currently no pending partner applications to review."}
      </p>
    </div>
  );
}