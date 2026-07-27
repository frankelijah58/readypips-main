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

    const stats = await db.collection("payment_intents").aggregate([
      { $match: { type: "challenge_payment" } },
      { $group: { _id: null, totalParticipants: { $sum: 1 }, totalRevenue: { $sum: "$amountKes" }, paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } } } },
    ]).toArray();

    return NextResponse.json({
      participants,
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