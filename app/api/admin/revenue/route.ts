import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import {
  PAID_INTENT_STATUSES,
  addAmountKesFieldStage,
  aggregateIntentRevenueKes,
  usdToKesRate,
} from "@/lib/dashboard-revenue";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = await getDatabase();
    const adminUser = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
    });

    if (
      !adminUser ||
      (!adminUser.isAdmin &&
        adminUser.role !== "admin" &&
        adminUser.role !== "superadmin")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const rate = usdToKesRate();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [summary, monthlyAgg, byPlan, totalPayments, activeSubscriptions] =
      await Promise.all([
        aggregateIntentRevenueKes(db),
        db
          .collection("payment_intents")
          .aggregate([
            {
              $match: {
                status: { $in: [...PAID_INTENT_STATUSES] },
                createdAt: { $gte: monthAgo },
              },
            },
            addAmountKesFieldStage(rate),
            { $group: { _id: null, sum: { $sum: "$amountKes" } } },
          ])
          .toArray(),
        db
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
          .toArray(),
        db
          .collection("payment_intents")
          .countDocuments({ status: { $in: [...PAID_INTENT_STATUSES] } }),
        db
          .collection("subscriptions")
          .find({ status: { $in: ["active", "trial"] } })
          .toArray(),
      ]);

    const monthlyRevenue = Number(monthlyAgg?.[0]?.sum || 0);
    const activeRevenue = activeSubscriptions.reduce((sum: number, sub: any) => {
      if (typeof sub.amountKes === "number" && sub.amountKes > 0) {
        return sum + sub.amountKes;
      }
      const raw = Number(sub.amount ?? sub.price ?? 0);
      if (!Number.isFinite(raw) || raw <= 0) return sum;
      const currency = String(sub.currency || "").toUpperCase();
      return sum + (currency === "KES" ? raw : raw * rate);
    }, 0);

    return NextResponse.json(
      {
        revenue: {
          total: parseFloat(Number(summary.total || 0).toFixed(2)),
          weekly: parseFloat(Number(summary.weekly || 0).toFixed(2)),
          monthly: parseFloat(monthlyRevenue.toFixed(2)),
          daily: parseFloat(Number(summary.daily || 0).toFixed(2)),
          active: parseFloat(activeRevenue.toFixed(2)),
          currency: "KES",
          byPlan,
          totalPayments,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
