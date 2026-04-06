import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdminDashboardAccess } from "@/lib/admin-dashboard-auth";
import { aggregateIntentRevenueKes } from "@/lib/dashboard-revenue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminDashboardAccess(req);
    if (!auth.ok) return auth.response;

    const db = await getDatabase();

    const revenue = await aggregateIntentRevenueKes(db);

    const [
      totalUsers,
      active,
      expired,
      trial,
      pending,
      toolAccessMetrics,
    ] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("subscriptions").countDocuments({ status: "active" }),
      db.collection("subscriptions").countDocuments({ status: "expired" }),
      db.collection("subscriptions").countDocuments({ status: "trial" }),
      db.collection("payment_intents").countDocuments({ status: "pending" }),
      db.collection("tools").countDocuments({ isActive: true }),
    ]);

    const formatUptime = (seconds: number) => {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (d > 0) return `${d}d ${h}h`;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    return NextResponse.json({
      stats: {
        totalUsers,
        active,
        expired,
        trial,
        pending,
        systemUptime: formatUptime(process.uptime()),
        toolAccessMetrics,
        revenue: {
          total: revenue.total,
          weekly: revenue.weekly,
          daily: revenue.daily,
        },
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
