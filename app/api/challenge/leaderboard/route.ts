import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

// GET - Public leaderboard for the funding page
export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const leaderboard = await db
      .collection("challenge_participants")
      .find({ status: "active" })
      .sort({ profit: -1, profitPercent: -1 })
      .limit(limit)
      .toArray();

    const formatted = leaderboard.map((p: any, index: number) => ({
      rank: index + 1,
      name: p.displayName || "Trader",
      profit: p.profit ? `+$${p.profit.toLocaleString()}` : "+$0",
      trades: p.trades || 0,
      winRate: p.winRate ? `${p.winRate}%` : "—",
      mt5_login: p.mt5_login,
      server: p.server,
    }));

    return NextResponse.json({
      success: true,
      leaderboard: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch leaderboard.",
        leaderboard: [],
      },
      { status: 500 }
    );
  }
}