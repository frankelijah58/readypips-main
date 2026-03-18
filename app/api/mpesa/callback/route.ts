import { NextRequest, NextResponse } from "next/server";

function extractCallbackItem(items: any[], name: string) {
  return items?.find((item) => item.Name === name)?.Value ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const callback =
      payload?.Body?.stkCallback ||
      payload?.body?.stkCallback ||
      null;

    if (!callback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    const items = CallbackMetadata?.Item || [];

    const amount = extractCallbackItem(items, "Amount");
    const mpesaReceiptNumber = extractCallbackItem(items, "MpesaReceiptNumber");
    const transactionDate = extractCallbackItem(items, "TransactionDate");
    const phoneNumber = extractCallbackItem(items, "PhoneNumber");

    /**
     * Update payment record in DB using CheckoutRequestID
     *
     * If ResultCode === 0:
     *   status = "paid"
     *   save mpesaReceiptNumber, amount, phoneNumber, transactionDate
     *   activate subscription for the user
     *
     * Else:
     *   status = "failed"
     *   save ResultDesc
     */

    console.log("M-Pesa Callback:", {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      amount,
      mpesaReceiptNumber,
      transactionDate,
      phoneNumber,
    });

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error("Callback error:", error);

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
}