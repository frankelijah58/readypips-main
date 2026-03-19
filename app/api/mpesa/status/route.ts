import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const db = await getDatabase();

    const latestPayment = await db.collection("payment_intents").findOne(
      { userId: decoded.userId, provider: "mpesa" },
      { sort: { createdAt: -1 } }
    );

    if (!latestPayment) {
      return NextResponse.json({
        success: true,
        status: "none",
      });
    }

    return NextResponse.json({
      success: true,
      status: latestPayment.status || "pending",
      receipt: latestPayment.mpesaReceiptNumber || null,
      reference: latestPayment.reference || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check payment status",
      },
      { status: 500 }
    );
  }
}