import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);

    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    // Aggregate total revenue in USD from completed payments.
    const revenueStats = await db.collection("payment_intents").aggregate([
      { $match: { status: { $in: ["success", "paid"] } } },
      {
        $addFields: {
          normalizedUsd: {
            $cond: [
              { $gt: ["$amountUsd", 0] },
              "$amountUsd",
              {
                $cond: [
                  { $eq: [{ $toUpper: { $ifNull: ["$currency", ""] } }, "USD"] },
                  { $ifNull: ["$amount", 0] },
                  {
                    $cond: [
                      {
                        $and: [
                          {
                            $eq: [
                              { $toUpper: { $ifNull: ["$currency", ""] } },
                              "KES",
                            ],
                          },
                          { $gt: ["$fxRateKesToUsd", 0] },
                        ],
                      },
                      { $multiply: [{ $ifNull: ["$amount", 0] }, "$fxRateKesToUsd"] },
                      0,
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$normalizedUsd" },
          count: { $sum: 1 },
        },
      },
    ]).toArray();

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    return NextResponse.json({ 
      revenue: { 
        total: totalRevenue,
        currency: "USD" // Note: Your API creates intents in USD
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}