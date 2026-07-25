import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = await getDatabase();
    const paymentsCollection = db.collection("payments");

    // Get user's payment history
    const payments = await paymentsCollection
      .find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Format payment data for frontend
    const formattedPayments = payments.map((payment) => ({
      id: payment._id.toString(),
      sessionId: payment.sessionId,
      provider: payment.provider,
      planName: payment.planName,
      amount: `${payment.currency} ${payment.amount.toFixed(2)}`,
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      payments: formattedPayments,
      total: payments.length,
    });
  } catch (error) {
    console.error("Payment history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
