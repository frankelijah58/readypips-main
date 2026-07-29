import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    let query: any = { type: "challenge_payment" };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { planName: { $regex: search, $options: "i" } },
      ];
    }

    const [participants, total] = await Promise.all([
      db.collection("payment_intents").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("payment_intents").countDocuments(query),
    ]);

    // Fetch MT5 credentials for each participant from challenge_participants collection
    const userIds = participants.map((p: any) => p.userId).filter(Boolean);
    const mt5Data = userIds.length > 0
      ? await db.collection("challenge_participants").find({ userId: { $in: userIds } }).toArray()
      : [];
    const mt5Map = new Map(mt5Data.map((m: any) => [m.userId, m]));

    // Merge MT5 data into participants
    const participantsWithMt5 = participants.map((p: any) => {
      const mt5 = mt5Map.get(p.userId);
      return {
        ...p,
        mt5_login: mt5?.mt5_login || null,
        mt5_password: mt5?.mt5_password || null,
        investor_password: mt5?.investor_password || null,
        mt5_server: mt5?.server || null,
        mt5_group: mt5?.group || null,
        mt5_balance: mt5?.balance || null,
        mt5_leverage: mt5?.leverage || null,
        mt5_status: mt5?.status || null,
        mt5_profit: mt5?.profit || null,
        mt5_trades: mt5?.trades || null,
        mt5_winRate: mt5?.winRate || null,
        mt5_displayName: mt5?.displayName || null,
        hasMt5: !!mt5,
      };
    });

    const stats = await db.collection("payment_intents").aggregate([
      { $match: { type: "challenge_payment" } },
      { $group: { _id: null, totalParticipants: { $sum: 1 }, totalRevenue: { $sum: "$amountKes" }, paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } } } },
    ]).toArray();

    return NextResponse.json({
      participants: participantsWithMt5,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats[0] || { totalParticipants: 0, totalRevenue: 0, paidCount: 0 },
    });
  } catch (error: any) {
    console.error("Funding participants error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}