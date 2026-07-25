import { Db } from "mongodb";

/** Status values used across providers on payment_intents */
export const PAID_INTENT_STATUSES = [
  "success",
  "completed",
  "paid",
  "confirmed",
] as const;

export function usdToKesRate(): number {
  const n = Number(process.env.USD_TO_KES || process.env.NEXT_PUBLIC_USD_TO_KES);
  return Number.isFinite(n) && n > 0 ? n : 150;
}

/**
 * Normalize intent amount to KES for dashboard display (Paystack/M-Pesa already KES).
 */
export function addAmountKesFieldStage(usdRate: number) {
  return {
    $addFields: {
      amountKes: {
        $let: {
          vars: {
            c: { $toUpper: { $ifNull: ["$currency", ""] } },
            amt: { $toDouble: { $ifNull: ["$amount", 0] } },
          },
          in: {
            $cond: [
              { $eq: ["$$c", "KES"] },
              "$$amt",
              { $multiply: ["$$amt", usdRate] },
            ],
          },
        },
      },
    },
  };
}

export function revenueAggregationStages(dayAgo: Date, weekAgo: Date, usdRate: number) {
  return [
    { $match: { status: { $in: [...PAID_INTENT_STATUSES] } } },
    addAmountKesFieldStage(usdRate),
    {
      $facet: {
        total: [{ $group: { _id: null, sum: { $sum: "$amountKes" } } }],
        daily: [
          { $match: { createdAt: { $gte: dayAgo } } },
          { $group: { _id: null, sum: { $sum: "$amountKes" } } },
        ],
        weekly: [
          { $match: { createdAt: { $gte: weekAgo } } },
          { $group: { _id: null, sum: { $sum: "$amountKes" } } },
        ],
      },
    },
  ];
}

export async function aggregateIntentRevenueKes(db: Db) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rate = usdToKesRate();

  const revenueAgg = await db
    .collection("payment_intents")
    .aggregate(revenueAggregationStages(dayAgo, weekAgo, rate))
    .toArray();

  const revenue = revenueAgg[0];
  return {
    total: revenue?.total?.[0]?.sum || 0,
    daily: revenue?.daily?.[0]?.sum || 0,
    weekly: revenue?.weekly?.[0]?.sum || 0,
  };
}
