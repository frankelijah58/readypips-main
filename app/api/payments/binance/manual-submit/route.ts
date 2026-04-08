import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/mongodb";
import { PLANS } from "@/lib/plans";

function resolvePlan(planId: string) {
  return PLANS.find(
    (p: any) =>
      p.id === planId ||
      p.planId === planId ||
      p.name?.toLowerCase().replace(/\s+/g, "") === planId
  );
}

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

    const existingIntentByTx = await db.collection("payment_intents").findOne({
      provider: "binance",
      $or: [
        { transactionId: transactionId.trim() },
        { "rawBinanceResponse.transactionId": transactionId.trim() },
      ],
    });
    if (existingIntentByTx) {
      return NextResponse.json(
        { message: "This Binance transaction ID has already been submitted" },
        { status: 409 }
      );
    }

    const reference = randomUUID();
    const planConfig = resolvePlan(planId);
    if (!planConfig) {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
    }
    const canonicalUsdAmount = Number(planConfig.usd || 0);
    if (!Number.isFinite(canonicalUsdAmount) || canonicalUsdAmount <= 0) {
      return NextResponse.json(
        { message: "Plan USD amount is not configured correctly" },
        { status: 400 }
      );
    }

    const paymentDoc = {
      reference,
      userId: userId || null,
      email: email || "",
      planId,
      provider: "binance",
      amount: canonicalUsdAmount,
      currency: "USDT",
      amountUsd: canonicalUsdAmount,
      currencyUsd: "USD",
      amount_paid_original: canonicalUsdAmount,
      currency_original: "USD",
      amount_converted: canonicalUsdAmount,
      exchange_rate_used: 1,
      requestedAmount: Number(amount),
      requestedCurrency: "USDT",
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

    const intentDoc = {
      reference,
      userId: userId || null,
      email: email || "",
      planId,
      provider: "binance",
      amount: canonicalUsdAmount,
      currency: "USDT",
      amountUsd: canonicalUsdAmount,
      currencyUsd: "USD",
      amount_paid_original: canonicalUsdAmount,
      currency_original: "USD",
      amount_converted: canonicalUsdAmount,
      exchange_rate_used: 1,
      requestedAmount: Number(amount),
      requestedCurrency: "USDT",
      status: "submitted_waiting_admin_approval",
      createdAt: new Date(),
      updatedAt: new Date(),
      customerMessage: planConfig
        ? `Manual USDT — ${planConfig.name}`
        : "Manual Binance USDT payment",
      responseCode: "MANUAL_SUBMITTED",
      responseDescription:
        "Binance manual payment submitted by user and awaiting admin approval",
      transactionId: transactionId.trim(),
      rawBinanceResponse: {
        manualFlow: true,
        transactionId: transactionId.trim(),
        senderWallet: senderWallet?.trim() || "",
        network: network || "TRC20",
        depositAddress:
          depositAddress || "TXpwFoc64Z8z7ZFBxEX95DATUeteZ4tk9n",
        note: note?.trim() || "",
        paymentsInsertId: result.insertedId.toString(),
        planName: planConfig?.name ?? null,
        duration: planConfig?.duration ?? null,
      },
    };

    try {
      await db.collection("payment_intents").insertOne(intentDoc);
    } catch (intentErr) {
      console.error("payment_intents insert failed (manual binance):", intentErr);
      await db.collection("payments").deleteOne({ _id: result.insertedId });
      return NextResponse.json(
        {
          message:
            "Could not record payment intent. Please try again or contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment submitted successfully",
      insertedId: result.insertedId,
      reference,
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
