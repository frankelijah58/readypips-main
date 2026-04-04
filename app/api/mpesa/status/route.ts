import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

function normalizeStatus(status: string | null | undefined) {
  const value = String(status || "").toLowerCase();

  if (["paid", "success", "completed", "active"].includes(value)) {
    return "success";
  }

  if (["failed", "cancelled", "canceled", "declined", "timeout"].includes(value)) {
    return "failed";
  }

  if (["pending", "initiated", "processing", "waiting"].includes(value)) {
    return "pending";
  }

  if (!value) {
    return "none";
  }

  return value;
}

function buildResponse(payment: any) {
  const normalized = normalizeStatus(payment?.status);

  return {
    success: true,
    paid: normalized === "success",
    status: normalized,
    rawStatus: payment?.status || null,
    receipt: payment?.mpesaReceiptNumber || null,
    reference: payment?.reference || null,
    amount: payment?.amount ?? payment?.amountKes ?? null,
    currency: payment?.currency || payment?.currencyKes || "KES",
    phone: payment?.phone || payment?.phoneNumber || null,
    planId: payment?.planId || null,
    planName: payment?.planName || null,
    merchantRequestID:
      payment?.merchantRequestID ||
      payment?.merchantRequestId ||
      null,
    checkoutRequestID:
      payment?.checkoutRequestID ||
      payment?.checkoutRequestId ||
      null,
    message:
      normalized === "success"
        ? "Payment confirmed successfully."
        : normalized === "failed"
        ? payment?.resultDesc ||
          payment?.responseDescription ||
          payment?.customerMessage ||
          "Payment failed."
        : payment?.customerMessage ||
          payment?.responseDescription ||
          "Waiting for payment confirmation.",
  };
}

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

    const decoded: any = verifyToken(token);
    if (!decoded?.userId && !decoded?.id) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId || decoded.id;
    const db = await getDatabase();

    const latestPayment = await db.collection("payment_intents").findOne(
      {
        userId,
        provider: "mpesa",
      },
      { sort: { createdAt: -1 } }
    );

    if (!latestPayment) {
      return NextResponse.json({
        success: true,
        paid: false,
        status: "none",
        message: "No M-Pesa payment found.",
      });
    }

    return NextResponse.json(buildResponse(latestPayment));
  } catch (error: any) {
    console.error("M-Pesa status GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to check payment status",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { merchantRequestID, checkoutRequestID } = body || {};

    if (!merchantRequestID && !checkoutRequestID) {
      return NextResponse.json(
        {
          success: false,
          message: "merchantRequestID or checkoutRequestID is required",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const payment = await db.collection("payment_intents").findOne({
      $or: [
        ...(merchantRequestID
          ? [
              { merchantRequestID },
              { merchantRequestId: merchantRequestID },
            ]
          : []),
        ...(checkoutRequestID
          ? [
              { checkoutRequestID },
              { checkoutRequestId: checkoutRequestID },
            ]
          : []),
      ],
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          paid: false,
          status: "none",
          message: "Payment record not found.",
          merchantRequestID: merchantRequestID || null,
          checkoutRequestID: checkoutRequestID || null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(buildResponse(payment));
  } catch (error: any) {
    console.error("M-Pesa status POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to check payment status",
      },
      { status: 500 }
    );
  }
}