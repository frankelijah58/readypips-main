"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { Navigation } from "@/components/navigation";

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("/api/affiliate/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setData(json);
      } catch {
        toast.error("Failed to load affiliate dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { subscription, referrer, payments = [] } = data || {};

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-10">
      <Navigation />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold">My Subscription</h1>
          <p className="text-sm text-zinc-500">
            Account overview for{" "}
            <span className="text-indigo-400">{user?.email}</span>
          </p>
        </header>

        {/* Subscription Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <InfoCard
            title="Plan"
            value={subscription?.planId?.toUpperCase() || "—"}
            icon={<CreditCard className="w-5 h-5 text-indigo-400" />}
          />
          <InfoCard
            title="Status"
            value={subscription?.status || "inactive"}
            icon={
              subscription?.status === "active" ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )
            }
          />
          <InfoCard
            title="Next Billing"
            value={
              subscription?.endDate
                ? new Date(subscription.endDate).toLocaleDateString()
                : "—"
            }
            icon={<Calendar className="w-5 h-5 text-amber-400" />}
          />
        </div>

        {/* Referrer */}
        {referrer && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Referred By
            </h3>
            <p className="text-sm text-zinc-400">
              Referral Code:{" "}
              <span className="text-indigo-300 font-mono">
                {referrer.referralCode}
              </span>
            </p>
            {referrer.platform && (
              <p className="text-xs text-zinc-500 mt-1">
                Platform: {referrer.platform}
              </p>
            )}
          </div>
        )}

        {/* Payment History */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Payment History</h3>

          {payments.length ? (
            <div className="space-y-4">
              {payments.map((p: any) => (
                <div
                  key={p._id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm">
                      ${p.amount} — {p.planId}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {p.status === "success" ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Success
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Declined
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No payment history found" />
          )}
        </div>
      </div>
    </div>
  );
}

/* UI helpers */

function InfoCard({ title, value, icon }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase text-zinc-500">{title}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-[150px] flex flex-col items-center justify-center text-zinc-600">
      <Inbox className="w-6 h-6 mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
