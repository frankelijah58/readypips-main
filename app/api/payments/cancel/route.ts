import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { checkoutRequestID, merchantRequestID, reference } = body || {};

    if (!checkoutRequestID && !merchantRequestID && !reference) {
      return NextResponse.json(
        { error: "Payment identifier is required" },
        { status: 400 }
      );
    }

    const orFilters: Record<string, any>[] = [];
    if (reference) orFilters.push({ reference });
    if (checkoutRequestID) {
      orFilters.push(
        { checkoutRequestID },
        { checkoutRequestId: checkoutRequestID }
      );
    }
    if (merchantRequestID) {
      orFilters.push(
        { merchantRequestID },
        { merchantRequestId: merchantRequestID }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    const result = await db.collection("payment_intents").updateMany(
      {
        userId: String(decoded.userId),
        status: { $in: ["pending", "initiated"] },
        $or: orFilters,
      },
      {
        $set: {
          status: "cancelled",
          failureReason: "Cancelled by user",
          resultDesc: "Cancelled by user",
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      cancelledCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Cancel payment error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to cancel payment" },
      { status: 500 }
    );
  }
}
