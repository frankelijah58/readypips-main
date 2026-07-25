"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type WebhookAttempt = {
  _id: string;
  event: string;
  reference?: string;
  processed: boolean;
  ignored?: boolean;
  ignoreReason?: string;
  error?: string;
  createdAt: string;
  processedAt?: string;
  diagnostics?: {
    intentFound: boolean;
    intentStatus?: string | null;
    intentUserId?: string | null;
    intentProvider?: string | null;
    planId?: string | null;
    subscriptionStatus?: string | null;
    userSubscriptionStatus?: string | null;
    reflected: boolean;
  };
};

export default function AdminWebhookAttempts() {
  const [attempts, setAttempts] = useState<WebhookAttempt[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    processed: number;
    failed: number;
    ignored: number;
    reflected: number;
    missingIntent: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WebhookAttempt | null>(null);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const res = await fetch("/api/admin/webhook-attempts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Unauthorized");

      const json = await res.json();
      const data = (json?.data || []) as WebhookAttempt[];
      setAttempts(data);
      setStats(json?.stats || null);
    } catch {
      toast.error("Failed to load webhook attempts");
    } finally {
      setLoading(false);
    }
  };

  const filtered = attempts?.filter((a) =>
    a.event.toLowerCase().includes(search.toLowerCase()) ||
    a.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-[#09090b] min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" />
              Admin: Webhook Attempts
            </h1>
            <p className="text-zinc-500">
              Inspect Whop webhook deliveries, failures, and ignored events.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search event or reference..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Stat label="Total" value={stats.total} />
            <Stat label="Processed" value={stats.processed} />
            <Stat label="Reflected" value={stats.reflected} />
            <Stat label="Failed" value={stats.failed} />
            <Stat label="Ignored" value={stats.ignored} />
            <Stat label="Missing Intent" value={stats.missingIntent} />
          </div>
        )}

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reflected</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800">
              {filtered.map((a) => (
                <tr
                  key={a._id}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-zinc-300">
                    {a.event}
                  </td>

                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {a.reference ?? "—"}
                  </td>

                  <td className="px-6 py-4">
                    {a.processed && !a.ignored && !a.error && (
                      <Status
                        icon={<CheckCircle className="w-4 h-4" />}
                        label="Processed"
                        color="emerald"
                      />
                    )}
                    {a.ignored && (
                      <Status
                        icon={<Clock className="w-4 h-4" />}
                        label="Ignored"
                        color="amber"
                      />
                    )}
                    {a.error && (
                      <Status
                        icon={<XCircle className="w-4 h-4" />}
                        label="Failed"
                        color="red"
                      />
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {a.diagnostics?.reflected ? (
                      <Status
                        icon={<CheckCircle className="w-4 h-4" />}
                        label="Yes"
                        color="emerald"
                      />
                    ) : (
                      <Status
                        icon={<XCircle className="w-4 h-4" />}
                        label="No"
                        color="red"
                      />
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-zinc-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(a)}
                      className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="p-6 text-center text-zinc-500">
              Loading webhook attempts…
            </div>
          )}
        </div>

        {/* Drawer / Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">Webhook Details</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <pre className="bg-black/60 p-4 rounded-lg text-xs text-zinc-300 overflow-auto max-h-[60vh]">
{JSON.stringify(selected, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------
   Status Badge Component
------------------------------------ */
function Status({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "emerald" | "amber" | "red";
}) {
  const colorClass: Record<"emerald" | "amber" | "red", string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${colorClass[color]}`}
    >
      {icon}
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
