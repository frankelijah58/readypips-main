import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET - List all challenge participants with MT5 data
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

    let query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { mt5_login: { $regex: search, $options: "i" } },
        { server: { $regex: search, $options: "i" } },
      ];
    }

    const [participants, total] = await Promise.all([
      db.collection("challenge_participants").find(query).sort({ profit: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("challenge_participants").countDocuments(query),
    ]);

    const stats = await db.collection("challenge_participants").aggregate([
      { $match: {} },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          activeCount: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalBalance: { $sum: "$balance" },
          totalProfit: { $sum: "$profit" },
        },
      },
    ]).toArray();

    return NextResponse.json({
      participants,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats[0] || { totalParticipants: 0, activeCount: 0, totalBalance: 0, totalProfit: 0 },
    });
  } catch (error: any) {
    console.error("Admin challenge participants error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update participant (leaderboard stats, status, etc.)
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { participantId, displayName, profit, profitPercent, trades, winRate, rank, status, balance, leverage } = body;

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const db = await getDatabase();

    const updateData: any = { updatedAt: new Date() };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (profit !== undefined) updateData.profit = Number(profit);
    if (profitPercent !== undefined) updateData.profitPercent = Number(profitPercent);
    if (trades !== undefined) updateData.trades = Number(trades);
    if (winRate !== undefined) updateData.winRate = Number(winRate);
    if (rank !== undefined) updateData.rank = Number(rank);
    if (status !== undefined) updateData.status = status;
    if (balance !== undefined) updateData.balance = Number(balance);
    if (leverage !== undefined) updateData.leverage = leverage;

    const filter = ObjectId.isValid(participantId)
      ? { _id: new ObjectId(participantId) }
      : { _id: participantId as any };

    const result = await db.collection("challenge_participants").updateOne(filter, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Participant updated successfully" });
  } catch (error: any) {
    console.error("Admin update participant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a participant
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("id");

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    const db = await getDatabase();

    const filter = ObjectId.isValid(participantId)
      ? { _id: new ObjectId(participantId) }
      : { _id: participantId as any };

    const result = await db.collection("challenge_participants").deleteOne(filter);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Participant removed successfully" });
  } catch (error: any) {
    console.error("Admin delete participant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}