import { NextRequest, NextResponse } from "next/server";
import { grantTradingViewAccess } from "@/lib/tradingview-private";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { tradingviewUsername } = await req.json();

    if (!tradingviewUsername) {
      return NextResponse.json(
        { error: "TradingView username is required" },
        { status: 400 }
      );
    }

    await grantTradingViewAccess(tradingviewUsername);

    return NextResponse.json({
      success: true,
      message: `Access granted to ${tradingviewUsername}`,
    });
  } catch (error: any) {
    console.error("TradingView Test Grant Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Grant failed",
      },
      { status: 500 }
    );
  }
}
