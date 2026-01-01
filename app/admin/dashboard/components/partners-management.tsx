'use client';

import React, { useEffect, useState } from "react";
import { 
  Check, X, Search, Globe, Mail, Calendar, Building2, Users, 
  Clock, TrendingUp, Edit2, Save, Percent, Award, ChevronDown, ChevronUp,
  ShieldCheck, MapPin, RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UserApplication {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "partner" | "affiliate";
  partnerProfile?: {
    companyName: string;
    tier: "silver" | "gold" | "platinum";
    revenueShare: number;
    isApproved: boolean;
    appliedAt: string;
    website?: string;
    location?: string;
  };
  affiliateProfile?: {
    commissionRate: number;
    isActive: boolean;
    appliedAt: string;
    source?: string;
  };
}

type FilterStatus = "pending" | "approved";

export default function PartnersManagement({ admin }: { admin: any }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    revenueShare: '',
    tier: '',
    commissionRate: '',
    companyName: '',
    website: '',
    location: '',
    source: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/applications?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setUsers(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, role: string, action: "approve" | "reject" | "update") => {
    try {
      const res = await fetch(`/api/admin/applications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId,
          role,
          status: action === "approve" ? "approved" : action === "reject" ? "declined" : undefined,
          updates: editForm
        }),
      });

      if (!res.ok) throw new Error();

      toast({ 
        title: action === "update" ? "Profile Updated" : "Status Changed", 
        description: `Successfully processed the request.` 
      });
      setEditingId(null);
      fetchApplications();
    } catch {
      toast({ title: "Action Failed", variant: "destructive" });
    }
  };

  const startEditing = (user: UserApplication) => {
    setEditingId(user._id);
    setEditForm({
      revenueShare: user.partnerProfile?.revenueShare?.toString() || '0',
      tier: user.partnerProfile?.tier || 'silver',
      commissionRate: user.affiliateProfile?.commissionRate?.toString() || '0',
      companyName: user.partnerProfile?.companyName || '',
      website: user.partnerProfile?.website || '',
      location: user.partnerProfile?.location || '',
      source: user.affiliateProfile?.source || ''
    });
  };

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-slate-50/50 min-h-screen animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Badge className="mb-2 bg-indigo-600 text-white border-none px-3 py-0.5 shadow-sm shadow-indigo-200">
            ADMIN PANEL
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Partner Ecosystem</h1>
          <p className="text-slate-500 mt-1">Review, authorize, and manage revenue parameters.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Filter by name or email..." 
              className="pl-10 w-full md:w-64 bg-white border-slate-200 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchApplications} variant="outline" size="icon" className="rounded-xl bg-white">
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit">
        {(["pending", "approved"] as FilterStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-2 text-sm font-bold rounded-xl transition-all capitalize",
              activeTab === tab 
                ? "bg-white text-slate-900 shadow-md" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            {tab === "pending" ? "Awaiting Review" : "Active Partners"}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          {loading ? (
            <LoadingTable />
          ) : filteredUsers.length < 1 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.15em] text-slate-400 bg-slate-50/50 font-bold border-b border-slate-100">
                    <th className="px-8 py-5">Partner Profile</th>
                    <th className="px-6 py-5">Role & Timeline</th>
                    <th className="px-6 py-5">Economic Terms</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => {
                    const isExpanded = expandedId === user._id;
                    const isEditing = editingId === user._id;
                    
                    return (
                      <React.Fragment key={user._id}>
                        <tr 
                          className={cn(
                            "hover:bg-indigo-50/30 transition-all cursor-pointer group",
                            isExpanded && "bg-indigo-50/50"
                          )}
                          onClick={() => !isEditing && setExpandedId(isExpanded ? null : user._id)}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold">
                                  {user.firstName[0]}{user.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-base flex items-center gap-2">
                                  {user.firstName} {user.lastName}
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400"/> : <ChevronDown className="w-4 h-4 text-slate-300"/>}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1.5">
                              <Badge className={cn(
                                "w-fit text-[10px] font-black uppercase tracking-widest border-none px-2 py-0",
                                user.role === 'partner' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {user.role}
                              </Badge>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3"/> {new Date(user.partnerProfile?.appliedAt || user.affiliateProfile?.appliedAt || '').toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 font-black text-slate-700">
                                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                                {user.role === 'partner' 
                                  ? `${((user.partnerProfile?.revenueShare || 0) * 100).toFixed(0)}% Split`
                                  : `${((user.affiliateProfile?.commissionRate || 0) * 100).toFixed(0)}% Rate`
                                }
                              </div>
                              {user.role === 'partner' && (
                                <Badge variant="outline" className="w-fit text-[9px] uppercase py-0 border-slate-200 text-slate-500">
                                  <Award className="w-2.5 h-2.5 mr-1 text-amber-500"/> {user.partnerProfile?.tier}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Button 
                              variant="ghost" 
                              className="rounded-full hover:bg-white hover:shadow-md border-transparent hover:border-slate-100"
                            >
                              Manage
                            </Button>
                          </td>
                        </tr>
                        
                        {/* Expanded Panel */}
                        {isExpanded && (
                          <tr className="bg-white/80 border-b border-indigo-100/50">
                            <td colSpan={4} className="px-10 py-8">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-top-4 duration-500">
                                
                                {/* Identity Column */}
                                <div className="space-y-4">
                                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Business Detail</h4>
                                  <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Organization</label>
                                      {isEditing ? (
                                        <Input 
                                          value={editForm.companyName} 
                                          onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                                          className="h-8 text-sm bg-white"
                                        />
                                      ) : (
                                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                          <Building2 className="w-4 h-4 text-slate-400"/> {user.partnerProfile?.companyName || "Personal Account"}
                                        </p>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">Website / Portfolio</label>
                                      {isEditing ? (
                                        <Input 
                                          value={editForm.website} 
                                          onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                                          className="h-8 text-sm bg-white"
                                        />
                                      ) : (
                                        <p className="text-sm font-medium text-blue-600 flex items-center gap-2">
                                          <Globe className="w-4 h-4 text-slate-400"/> 
                                          <a href={user.partnerProfile?.website} target="_blank" className="hover:underline">
                                            {user.partnerProfile?.website || "Not provided"}
                                          </a>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Inside the "Growth Metrics" column of your expanded panel */}
                                <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                
                                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Partner Metrics</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    
                                    {/* Tier Selection - Only for Partners */}
                                    {user.role === 'partner' && (
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Partner Tier</label>
                                        {isEditing ? (
                                          <Select 
                                            value={editForm.tier} 
                                            onValueChange={(val) => setEditForm({...editForm, tier: val})}
                                          >
                                            <SelectTrigger className="h-8 bg-white text-xs">
                                              <SelectValue placeholder="Select Tier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="silver">Silver</SelectItem>
                                              <SelectItem value="gold">Gold</SelectItem>
                                              <SelectItem value="platinum">Platinum</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <Badge className={cn(
                                            "capitalize",
                                            user.partnerProfile?.tier === 'platinum' ? "bg-slate-900 text-white" : 
                                            user.partnerProfile?.tier === 'gold' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                          )}>
                                            {user.partnerProfile?.tier}
                                          </Badge>
                                        )}
                                      </div>
                                    )}

                                    {/* Financial Rates */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                                        {user.role === 'partner' ? 'Revenue Share (%)' : 'Commission Rate (%)'}
                                      </label>
                                      {isEditing ? (
                                        <div className="relative">
                                          <Input 
                                            type="number"
                                            value={user.role === 'partner' ? editForm.revenueShare : editForm.commissionRate} 
                                            onChange={(e) => setEditForm({
                                              ...editForm, 
                                              [user.role === 'partner' ? 'revenueShare' : 'commissionRate']: e.target.value
                                            })}
                                            className="h-8 text-sm bg-white pr-6"
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                                        </div>
                                      ) : (
                                        <p className="text-sm font-black text-slate-800">
                                          {user.role === 'partner' 
                                            ? `${(user.partnerProfile?.revenueShare || 0) * 100}%` 
                                            : `${(user.affiliateProfile?.commissionRate || 0) * 100}%`
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Terms Column */}
                                <div className="space-y-4">
                                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Growth Metrics</h4>
                                  <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                      {/* <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Commission/Share</label>
                                        {isEditing ? (
                                          <Input 
                                            value={user.role === 'partner' ? editForm.revenueShare : editForm.commissionRate} 
                                            onChange={(e) => setEditForm({
                                              ...editForm, 
                                              [user.role === 'partner' ? 'revenueShare' : 'commissionRate']: e.target.value
                                            })}
                                            className="h-8 text-sm bg-white"
                                          />
                                        ) : (
                                          <p className="text-sm font-bold text-slate-800">
                                            {user.role === 'partner' ? (user.partnerProfile?.revenueShare || 0) * 100 : (user.affiliateProfile?.commissionRate || 0) * 100}%
                                          </p>
                                        )}
                                      </div> */}
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                                        {isEditing ? (
                                          <Input 
                                            value={editForm.location} 
                                            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                            className="h-8 text-sm bg-white"
                                          />
                                        ) : (
                                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-slate-400"/> {user.partnerProfile?.location || "Remote"}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/50">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Lead Source</span>
                                        <span className="text-xs font-black text-slate-700">{user.affiliateProfile?.source || "Direct Dashboard"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions Column */}
                                <div className="space-y-4">
                                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Management</h4>
                                  <div className="flex flex-col gap-3">
                                    {isEditing ? (
                                      <>
                                        <Button 
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                          onClick={() => handleAction(user._id, user.role, 'update')}
                                        >
                                          <Save className="w-4 h-4 mr-2"/> Save Changes
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          className="w-full text-slate-400"
                                          onClick={() => setEditingId(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button 
                                          className="w-full bg-slate-900 hover:bg-black rounded-xl"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(user);
                                          }}
                                        >
                                          <Edit2 className="w-4 h-4 mr-2"/> Modify Terms
                                        </Button>
                                        {activeTab === 'pending' && (
                                          <div className="flex gap-2">
                                            <Button 
                                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-100" 
                                              onClick={() => handleAction(user._id, user.role, 'approve')}
                                            >
                                              Approve
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              className="flex-1 text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl"
                                              onClick={() => handleAction(user._id, user.role, 'reject')}
                                            >
                                              Decline
                                            </Button>
                                          </div>
                                        )}
                                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                                          <p className="text-[10px] text-indigo-600 font-medium leading-relaxed">
                                            <ShieldCheck className="w-3 h-3 inline mr-1 mb-0.5"/>
                                            Editing profile will notify the user via their registered email address.
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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

// ... EmptyState and LoadingTable functions remain similar to previous but with updated tailwind colors/shadows ...
// 'use client';

// import { useEffect, useState } from "react";
// import { 
//   Check, X, Search, Globe, Mail, Calendar, Building2, Users, 
//   Clock, TrendingUp, Edit2, Save, Percent, Award, ChevronDown, ChevronUp,
//   Link2, ShieldCheck, MapPin
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { cn } from "@/lib/utils";

// interface UserApplication {
//   _id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   role: "partner" | "affiliate";
//   partnerProfile?: {
//     companyName: string;
//     tier: "silver" | "gold" | "platinum";
//     revenueShare: number;
//     isApproved: boolean;
//     appliedAt: string;
//     website?: string; // Added field
//     location?: string; // Added field
//   };
//   affiliateProfile?: {
//     commissionRate: number;
//     isActive: boolean;
//     appliedAt: string;
//     source?: string; // Added field (e.g. YouTube, Blog)
//   };
// }


// type FilterStatus = "pending" | "approved";

// export default function PartnersManagement({admin}: {admin: any}) {
//   const { toast } = useToast();
//   const [users, setUsers] = useState<UserApplication[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [expandedId, setExpandedId] = useState<string | null>(null);
  
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editForm, setEditForm] = useState({ revenueShare: '', tier: '', commissionRate: '' });

//   useEffect(() => { fetchApplications(); }, [activeTab]);

//   const fetchApplications = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(`/api/admin/applications?status=${activeTab}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       const data = await res.json();
//       setUsers(data || []);
//     } catch (error) {
//       toast({ title: "Error", description: "Failed to fetch applications", variant: "destructive" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAction = async (userId: string, role: string, action: "approve" | "reject" | "revoke" | "update") => {
//     try {
//       const res = await fetch(`/api/admin/applications`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({ 
//           userId, 
//           role, 
//           status: action === "approve" ? "approved" : action === "reject" ? "declined" : undefined,
//           updates: editForm 
//         }),
//       });

//       if (!res.ok) throw new Error();

//       toast({ title: "Success", description: `Application updated successfully.` });
//       setEditingId(null);
//       fetchApplications();
//     } catch {
//       toast({ title: "Action Failed", variant: "destructive" });
//     }
//   };

//   const filteredUsers = users.filter((u) =>
//     u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className="max-w-7xl mx-auto p-6 space-y-8 bg-slate-50/50 min-h-screen">
//       {/* Header - Styled for clarity */}
//       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div>
//           <Badge className="mb-2 bg-indigo-100 text-indigo-700 border-none px-3">ADMIN CONSOLE</Badge>
//           <h1 className="text-4xl font-black tracking-tight text-slate-900">Partner Ecosystem</h1>
//           <p className="text-slate-500 mt-1">Manage high-level partnerships and affiliate growth.</p>
//         </div>
//         <div className="flex gap-2">
//             <Button 
//                 variant={activeTab === 'pending' ? 'default' : 'outline'}
//                 onClick={() => setActiveTab('pending')}
//                 className="rounded-full px-6"
//             >
//                 Pending Review
//             </Button>
//             <Button 
//                 variant={activeTab === 'approved' ? 'default' : 'outline'}
//                 onClick={() => setActiveTab('approved')}
//                 className="rounded-full px-6"
//             >
//                 Verified Members
//             </Button>
//         </div>
//       </div>

//       <Card className="border-none shadow-xl shadow-slate-200/60 bg-white overflow-hidden">
//         <CardContent className="p-0">
//           {loading ? (
//             <LoadingTable />
//           ) : (
//           filteredUsers.length < 1 ? (
//           <EmptyState tab={activeTab} />
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400 bg-slate-50/80 font-bold border-b border-slate-100">
//                   <th className="px-6 py-4">User & Contact</th>
//                   <th className="px-6 py-4">Status & Role</th>
//                   <th className="px-6 py-4">Earnings Configuration</th>
//                   <th className="px-6 py-4 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {filteredUsers.map((user) => (
//                   <>
//                     <tr 
//                       key={user._id} 
//                       className={cn(
//                         "hover:bg-slate-50/50 transition-all cursor-pointer group",
//                         expandedId === user._id && "bg-blue-50/30"
//                       )}
//                       onClick={() => setExpandedId(expandedId === user._id ? null : user._id)}
//                     >
//                       <td className="px-6 py-4">
//                         <div className="flex items-center gap-3">
//                           <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
//                             <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold">
//                               {user.firstName[0]}{user.lastName[0]}
//                             </AvatarFallback>
//                           </Avatar>
//                           <div className="flex flex-col">
//                             <span className="font-bold text-slate-900 flex items-center gap-1">
//                                 {user.firstName} {user.lastName}
//                                 {expandedId === user._id ? <ChevronUp className="w-3 h-3 text-slate-400"/> : <ChevronDown className="w-3 h-3 text-slate-400"/>}
//                             </span>
//                             <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3"/> {user.email}</span>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex flex-col gap-1">
//                             <Badge className={cn(
//                                 "w-fit text-[10px] font-bold uppercase tracking-wider border-none shadow-none",
//                                 user.role === 'partner' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
//                             )}>
//                                 {user.role}
//                             </Badge>
//                             <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
//                                 <Clock className="w-3 h-3"/> Applied {new Date(user.partnerProfile?.appliedAt || user.affiliateProfile?.appliedAt || '').toLocaleDateString()}
//                             </span>
//                         </div>
//                       </td>
                      
//                       <td className="px-6 py-4">
//                         <div className="flex flex-col">
//                             <div className="flex items-center gap-2 font-bold text-slate-700">
//                                 <Percent className="w-3.5 h-3.5 text-indigo-500" />
//                                 {user.role === 'partner' 
//                                     ? `${((user.partnerProfile?.revenueShare || 0) * 100).toFixed(0)}% Share`
//                                     : `${((user.affiliateProfile?.commissionRate || 0) * 100).toFixed(0)}% Rate`
//                                 }
//                             </div>
//                             {user.role === 'partner' && (
//                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
//                                     <Award className="w-3 h-3 text-amber-500"/> {user.partnerProfile?.tier} Tier
//                                 </span>
//                             )}
//                         </div>
//                       </td>

//                       <td className="px-6 py-4 text-right">
//                          <Button variant="ghost" size="sm" className="rounded-full hover:bg-white shadow-sm border border-transparent hover:border-slate-200">
//                             Details
//                          </Button>
//                       </td>
//                     </tr>
                    
//                     {/* EXPANDED DETAIL PANEL */}
//                     {expandedId === user._id && (
//                       <tr className="bg-slate-50/50">
//                         <td colSpan={4} className="px-8 py-6">
//                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-300">
//                                 {/* Profile Details */}
//                                 <div className="space-y-3">
//                                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Identity</h4>
//                                     <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
//                                         <div className="flex items-center gap-2 text-sm text-slate-600">
//                                             <Building2 className="w-4 h-4 text-slate-400"/>
//                                             <span className="font-semibold text-slate-900">{user.partnerProfile?.companyName || "Independent Contractor"}</span>
//                                         </div>
//                                         <div className="flex items-center gap-2 text-sm text-slate-600">
//                                             <Globe className="w-4 h-4 text-slate-400"/>
//                                             <a href="#" className="text-blue-500 hover:underline">{user.partnerProfile?.website || "No website provided"}</a>
//                                         </div>
//                                         <div className="flex items-center gap-2 text-sm text-slate-600">
//                                             <MapPin className="w-4 h-4 text-slate-400"/>
//                                             <span>{user.partnerProfile?.location || "Global / Remote"}</span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Status & Metrics */}
//                                 <div className="space-y-3">
//                                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Status</h4>
//                                     <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-xs text-slate-500">Member Since</span>
//                                             <span className="text-xs font-bold">{new Date().getFullYear()}</span>
//                                         </div>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-xs text-slate-500">Security Clearance</span>
//                                             <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px]"><ShieldCheck className="w-3 h-3 mr-1"/> Verified</Badge>
//                                         </div>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-xs text-slate-500">Primary Channel</span>
//                                             <span className="text-xs font-bold capitalize">{user.affiliateProfile?.source || "Direct Search"}</span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Quick Controls */}
//                                 <div className="space-y-3">
//                                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management Actions</h4>
//                                     <div className="flex flex-col gap-2">
//                                         <Button 
//                                             size="sm" 
//                                             className="w-full bg-slate-900"
//                                             onClick={() => {
//                                                 setEditingId(user._id);
//                                                 setEditForm({
//                                                     revenueShare: user.partnerProfile?.revenueShare.toString() || '',
//                                                     tier: user.partnerProfile?.tier || '',
//                                                     commissionRate: user.affiliateProfile?.commissionRate.toString() || ''
//                                                 });
//                                             }}
//                                         >
//                                             <Edit2 className="w-3 h-3 mr-2"/> Edit Terms
//                                         </Button>
//                                         {activeTab === 'pending' && (
//                                             <div className="flex gap-2">
//                                                 <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(user._id, user.role, 'approve')}>Approve</Button>
//                                                 <Button variant="outline" className="flex-1 text-rose-500 border-rose-100 hover:bg-rose-50" onClick={() => handleAction(user._id, user.role, 'reject')}>Decline</Button>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                            </div>
//                         </td>
//                       </tr>
//                     )}
//                   </>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ))}</CardContent>
//       </Card>
//     </div>
//   );
// }

