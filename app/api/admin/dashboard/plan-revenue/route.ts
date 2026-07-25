import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdminDashboardAccess } from "@/lib/admin-dashboard-auth";
import {
  PAID_INTENT_STATUSES,
  addAmountKesFieldStage,
  usdToKesRate,
} from "@/lib/dashboard-revenue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminDashboardAccess(req);
    if (!auth.ok) return auth.response;

    const db = await getDatabase();
    const rate = usdToKesRate();

    const plans = await db
      .collection("payment_intents")
      .aggregate([
        { $match: { status: { $in: [...PAID_INTENT_STATUSES] } } },
        addAmountKesFieldStage(rate),
        {
          $group: {
            _id: "$planId",
            totalRevenue: { $sum: "$amountKes" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ])
      .toArray();

    const totalRevenue = plans.reduce((s, p) => s + p.totalRevenue, 0);

    const formatted = plans.map((p) => ({
      name: p._id || "Unknown",
      revenue: `KES ${Math.round(p.totalRevenue).toLocaleString()}`,
      percentage: totalRevenue
        ? Math.round((p.totalRevenue / totalRevenue) * 100)
        : 0,
      count: p.count,
    }));

    return NextResponse.json({ plans: formatted });
  } catch (err) {
    console.error("Plan revenue error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
