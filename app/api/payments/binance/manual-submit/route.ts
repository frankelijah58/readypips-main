import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      userId,
      email,
      planId,
      amount,
      transactionId,
      senderWallet,
      network,
      depositAddress,
      note,
    } = body;

    if (!planId || !amount || !transactionId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const existing = await db.collection("payments").findOne({
      transactionId: transactionId.trim(),
      provider: "binance",
    });

    if (existing) {
      return NextResponse.json(
        { message: "This transaction ID has already been submitted" },
        { status: 409 }
      );
    }

    const reference = randomUUID();

    const paymentDoc = {
      reference,
      userId: userId || null,
      email: email || "",
      planId,
      provider: "binance",
      amount: Number(amount),
      currency: "USDT",
      status: "submitted_waiting_admin_approval",
      createdAt: new Date(),
      updatedAt: new Date(),

      paymentIntentId: reference,
      customerMessage:
        "Manual Binance payment submitted and waiting for admin approval",
      merchantRequestID: null,
      checkoutRequestID: null,
      phone: null,

      transactionId: transactionId.trim(),
      senderWallet: senderWallet?.trim() || "",
      network: network || "TRC20",
      depositAddress:
        depositAddress || "TXpwFoc64Z8z7ZFBxEX95DATUeteZ4tk9n",
      note: note?.trim() || "",

      rawStkResponse: null,
      responseCode: "MANUAL_SUBMITTED",
      responseDescription:
        "Binance manual payment submitted by user and awaiting admin approval",
    };

    const result = await db.collection("payments").insertOne(paymentDoc);

    return NextResponse.json({
      success: true,
      message: "Payment submitted successfully",
      insertedId: result.insertedId,
      status: "submitted_waiting_admin_approval",
    });
  } catch (error) {
    console.error("BINANCE MANUAL SUBMIT ERROR:", error);
    return NextResponse.json(
      { message: "Server error while submitting payment" },
      { status: 500 }
    );
  }
}