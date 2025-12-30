"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
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
        description: "Action completed successfully",
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

  if (loading) {
    return <div className="text-center py-20">Loading partner applications…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Partner Applications</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Partner</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Company</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Applied</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {partners.length > 0 ? (
              partners.map((partner) => (
                <tr key={partner._id}>
                  <td className="px-6 py-4">
                    <p className="font-medium">
                      {partner.firstName} {partner.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{partner.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {partner.partnerProfile.companyName}
                  </td>
                  <td className="px-6 py-4">
                    {partner.partnerProfile.country || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(
                      partner.partnerProfile.appliedAt
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(partner._id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(partner._id, "reject")}
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No pending partner applications
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
