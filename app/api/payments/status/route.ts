import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantRequestID, checkoutRequestID } = body as {
      merchantRequestID?: string;
      checkoutRequestID?: string;
    };

    if (!merchantRequestID && !checkoutRequestID) {
      return NextResponse.json(
        { status: "failed", message: "Missing tracking IDs" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const payment = await db.collection("payment_intents").findOne({
      $or: [
        ...(merchantRequestID ? [{ merchantRequestID }] : []),
        ...(checkoutRequestID ? [{ checkoutRequestID }] : []),
      ],
    });

    if (!payment) {
      return NextResponse.json({ status: "waiting" });
    }

    if (payment.status === "success" || payment.paid === true) {
      return NextResponse.json({
        status: "success",
        paid: true,
        reference: payment.reference,
      });
    }

    if (payment.status === "failed") {
      return NextResponse.json({
        status: "failed",
        message: payment.failureReason || payment.resultDesc || "Payment failed",
      });
    }

    return NextResponse.json({
      status: "waiting",
      reference: payment.reference,
    });
  } catch (error: any) {
    console.error("MPESA STATUS ERROR:", error);
    return NextResponse.json(
      { status: "failed", message: error.message || "Server error" },
      { status: 500 }
    );
  }
}