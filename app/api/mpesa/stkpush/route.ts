import { NextRequest, NextResponse } from "next/server";
import { generateReference, initiateStkPush } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      phoneNumber,
      amount,
      planId,
      planName,
      duration,
      userId,
    } = body;

    if (!phoneNumber || !amount || !planId) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number, amount, and plan are required.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment amount.",
        },
        { status: 400 }
      );
    }

    const accountReference = generateReference("READYPIPS");

    const stk = await initiateStkPush({
      amount: Math.round(numericAmount),
      phoneNumber,
      accountReference,
      transactionDesc: planName
        ? `${planName} subscription`
        : "ReadyPips subscription",
    });

    /**
     * Save pending payment to your DB here
     *
     * Suggested fields:
     * - userId
     * - planId
     * - planName
     * - duration
     * - amount
     * - phoneNumber
     * - accountReference
     * - MerchantRequestID
     * - CheckoutRequestID
     * - status: "pending"
     * - rawResponse: stk
     */

    console.log("STK Push success:", {
      userId,
      planId,
      planName,
      duration,
      amount: numericAmount,
      phoneNumber,
      accountReference,
      MerchantRequestID: stk.MerchantRequestID,
      CheckoutRequestID: stk.CheckoutRequestID,
    });

    return NextResponse.json({
      success: true,
      message: stk.CustomerMessage || "STK Push sent successfully.",
      data: {
        MerchantRequestID: stk.MerchantRequestID,
        CheckoutRequestID: stk.CheckoutRequestID,
        ResponseCode: stk.ResponseCode,
        ResponseDescription: stk.ResponseDescription,
        CustomerMessage: stk.CustomerMessage,
      },
    });
  } catch (error: any) {
    console.error("STK Push route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send STK push.",
      },
      { status: 500 }
    );
  }
}