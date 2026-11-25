import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { queryStkPush } from "@/lib/mpesa";
import { getDatabase } from "@/lib/mongodb";
import { PAID_INTENT_STATUSES } from "@/lib/dashboard-revenue";
import { normalizePaymentChannel } from "@/lib/payment-provider";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { checkoutRequestId } = body;

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, message: "checkoutRequestId is required" },
        { status: 400 }
      );
    }

    const result = await queryStkPush({
      checkoutRequestId,
    });

    const resultCode =
      result?.ResultCode !== undefined && result?.ResultCode !== null
        ? String(result.ResultCode)
        : null;

    if (resultCode !== null) {
      const db = await getDatabase();
      const intent = await db.collection("payment_intents").findOne({
        $or: [
          { checkoutRequestID: checkoutRequestId },
          { checkoutRequestId },
        ],
      });

      const alreadyPaid =
        intent &&
        PAID_INTENT_STATUSES.includes(
          String(intent.status || "").toLowerCase() as any
        );

      if (intent && !alreadyPaid) {
        const now = new Date();
        if (resultCode === "0") {
          const finalAmountKes = Number(intent.amountKes ?? intent.amount ?? 0);
          await db.collection("payment_intents").updateOne(
            { _id: intent._id },
            {
              $set: {
                status: "paid",
                resultCode,
                resultDesc: result?.ResultDesc || "Payment confirmed via STK query",
                amountSource: intent.amountSource || "mpesa_stk_query",
                paidAt: intent.paidAt || now,
                processedAt: now,
                updatedAt: now,
              },
            }
          );

          const userId = intent.userId;
          const durationDays = Number(intent.duration || 0);
          const existingSub = await db.collection("subscriptions").findOne({
            userId,
            status: "active",
          });

          let startDate = new Date();
          if (existingSub?.endDate && new Date(existingSub.endDate) > startDate) {
            startDate = new Date(existingSub.endDate);
          }

          let endDate: Date | null = null;
          if (durationDays > 0) {
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + durationDays);
          }

          await db.collection("subscriptions").updateOne(
            { userId },
            {
              $set: {
                userId,
                planId: intent.planId || null,
                planName: intent.planName || intent.planId || null,
                provider: "mpesa",
                paymentChannel: normalizePaymentChannel("mpesa"),
                amount: finalAmountKes,
                currency: "KES",
                amountKes: finalAmountKes,
                currencyKes: "KES",
                status: "active",
                startDate,
                endDate,
                updatedAt: now,
              },
            },
            { upsert: true }
          );

          const userIdStr = String(userId || "");
          if (userIdStr) {
            const userQuery = ObjectId.isValid(userIdStr)
              ? { $or: [{ _id: new ObjectId(userIdStr) }, { _id: userIdStr as any }, { userId: userIdStr }] }
              : { $or: [{ _id: userIdStr as any }, { userId: userIdStr }] };

            await db.collection("users").updateOne(userQuery as any, {
              $set: {
                subscriptionStatus: "active",
                subscriptionType: intent.planId || "premium",
                subscriptionPlanId: intent.planId || null,
                subscriptionPlanName: intent.planName || intent.planId || null,
                subscriptionProvider: "mpesa",
                paymentChannel: normalizePaymentChannel("mpesa"),
                subscriptionStartedAt: startDate,
                subscriptionExpiresAt: endDate,
                subscriptionEndDate: endDate,
                paymentStatus: "paid",
                updatedAt: now,
              },
            });
          }
        } else if (
          String(intent.status || "").toLowerCase() === "pending" &&
          ["1", "1032", "1037", "2001"].includes(resultCode)
        ) {
          await db.collection("payment_intents").updateOne(
            { _id: intent._id },
            {
              $set: {
                status: "failed",
                resultCode,
                resultDesc: result?.ResultDesc || "Payment not completed",
                processedAt: now,
                updatedAt: now,
              },
            }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Query failed" },
      { status: 500 }
    );
  }
}
