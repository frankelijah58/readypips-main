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

    // Aggregate total revenue from successful payments
    const revenueStats = await db.collection("payment_intents").aggregate([
      { $match: { status: "success" } }, // Only count completed payments
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
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