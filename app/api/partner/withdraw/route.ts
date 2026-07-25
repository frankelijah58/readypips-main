import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

// POST: Partner creates a withdrawal request
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");
    if (!decoded?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount } = await req.json();
    if (amount < 50) return NextResponse.json({ error: "Minimum withdrawal is $50" }, { status: 400 });

    const db = await getDatabase();
    
    // Check if there is already a pending request
    const existing = await db.collection("withdrawals").findOne({ 
      userId: new ObjectId(decoded.userId), 
      status: "pending" 
    });
    if (existing) return NextResponse.json({ error: "Withdrawal already pending" }, { status: 400 });

    const withdrawalRequest = {
      userId: new ObjectId(decoded.userId),
      amount: amount,
      fee: amount * 0.06,
      netAmount: amount * 0.94,
      status: "pending",
      createdAt: new Date(),
    };

    await db.collection("withdrawals").insertOne(withdrawalRequest);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

