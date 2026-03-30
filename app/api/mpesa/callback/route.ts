import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendSms } from "@/lib/sms";

function extractCallbackItem(items: any[], name: string) {
  return items?.find((item) => item.Name === name)?.Value ?? null;
}

function parseMpesaDate(value: any) {
  if (!value) return null;

  const raw = String(value);
  if (!/^\d{14}$/.test(raw)) return null;

  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6)) - 1;
  const day = Number(raw.slice(6, 8));
  const hour = Number(raw.slice(8, 10));
  const minute = Number(raw.slice(10, 12));
  const second = Number(raw.slice(12, 14));

  return new Date(year, month, day, hour, minute, second);
}

function buildUserQuery(userId: string): Record<string, any> | null {
  if (!userId) return null;

  if (ObjectId.isValid(userId)) {
    return {
      $or: [{ _id: new ObjectId(userId) }, { _id: userId }, { userId }],
    };
  }

  return {
    $or: [{ _id: userId }, { userId }],
  };
}

// Change this if you want a different conversion rate
const KES_TO_USD_RATE = 130;

function kesToUsd(amountKes: any) {
  const numericKes = Number(amountKes || 0);
  if (!Number.isFinite(numericKes)) return 0;
  return Number((numericKes / KES_TO_USD_RATE).toFixed(2));
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("CALLBACK HIT:", JSON.stringify(payload));

    const callback = payload?.Body?.stkCallback || payload?.body?.stkCallback || null;

    if (!callback) {
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    const items = CallbackMetadata?.Item || [];

    const amountKes = extractCallbackItem(items, "Amount");
    const mpesaReceiptNumber = extractCallbackItem(items, "MpesaReceiptNumber");
    const transactionDate = extractCallbackItem(items, "TransactionDate");
    const phoneNumber = extractCallbackItem(items, "PhoneNumber");
    const paidAt = parseMpesaDate(transactionDate);

    const db = await getDatabase();

    const paymentIntent = await db.collection("payment_intents").findOne({
      $or: [
        { checkoutRequestID: CheckoutRequestID },
        { merchantRequestID: MerchantRequestID },
      ],
    });

    if (!paymentIntent) {
      console.warn("No payment_intent found for callback", {
        MerchantRequestID,
        CheckoutRequestID,
      });

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    const isSuccessful = String(ResultCode) === "0";
    const now = new Date();

    const finalAmountKes =
      amountKes ?? paymentIntent.amountKes ?? paymentIntent.amount ?? 0;

    const finalAmountUsd = kesToUsd(finalAmountKes);

    const finalPhone =
      phoneNumber ?? paymentIntent.phone ?? paymentIntent.phoneNumber ?? null;

    // Update payment intent
    await db.collection("payment_intents").updateOne(
      { _id: paymentIntent._id },
      {
        $set: {
          status: isSuccessful ? "paid" : "failed",
          resultCode: ResultCode,
          resultDesc: ResultDesc,

          // Main stored amount in USD
          amount: finalAmountUsd,
          currency: "USD",

          // Keep original KES for reference
          amountKes: Number(finalAmountKes || 0),
          currencyKes: "KES",

          mpesaReceiptNumber: mpesaReceiptNumber ?? null,
          transactionDate: transactionDate ?? null,
          paidAt: isSuccessful ? paidAt || now : null,
          phone: finalPhone,
          phoneNumber: finalPhone,
          callbackPayload: payload,
          updatedAt: now,
        },
      }
    );

    if (isSuccessful) {
      const userId = String(paymentIntent.userId || "");
      const durationDays = Number(paymentIntent.duration || 0);

      // Decline other pending intents for same user
      await db.collection("payment_intents").updateMany(
        {
          userId: paymentIntent.userId,
          _id: { $ne: paymentIntent._id },
          status: { $in: ["pending", "initiated"] },
        },
        {
          $set: {
            status: "declined",
            processedAt: now,
            updatedAt: now,
          },
        }
      );

      const existingSub = await db.collection("subscriptions").findOne({
        userId: paymentIntent.userId,
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
        { userId: paymentIntent.userId },
        {
          $set: {
            userId: paymentIntent.userId,
            planId: paymentIntent.planId || null,
            planName: paymentIntent.planName || paymentIntent.planId || null,
            provider: "mpesa",

            // Store USD
            amount: finalAmountUsd,
            currency: "USD",

            // Keep KES too
            amountKes: Number(finalAmountKes || 0),
            currencyKes: "KES",

            status: "active",
            startDate,
            endDate,
            updatedAt: now,
          },
        },
        { upsert: true }
      );

      const userQuery = buildUserQuery(userId);

      if (userQuery) {
        await db.collection("users").updateOne(
          userQuery as any,
          {
            $set: {
              subscriptionStatus: "active",
              subscriptionType: paymentIntent.planId || "premium",
              subscriptionPlanId: paymentIntent.planId || null,
              subscriptionPlanName:
                paymentIntent.planName || paymentIntent.planId || null,
              subscriptionProvider: "mpesa",
              subscriptionStartedAt: startDate,
              subscriptionExpiresAt: endDate,
              subscriptionEndDate: endDate,
              paymentStatus: "paid",
              updatedAt: now,
            },
            $push: {
              paymentHistory: {
                reference: paymentIntent.reference || null,
                provider: "mpesa",

                // Store USD
                amount: finalAmountUsd,
                currency: "USD",

                // Keep KES too
                amountKes: Number(finalAmountKes || 0),
                currencyKes: "KES",

                mpesaReceiptNumber: mpesaReceiptNumber ?? null,
                checkoutRequestID: CheckoutRequestID ?? null,
                merchantRequestID: MerchantRequestID ?? null,
                phoneNumber: finalPhone,
                paidAt: paidAt || now,
              },
            },
          } as any
        );
      }

      try {
        if (finalPhone) {
          await sendSms({
            mobile: String(finalPhone),
            message: `ReadyPips: Payment of KES ${Number(finalAmountKes || 0).toLocaleString()} received successfully. Receipt ${mpesaReceiptNumber || "-"}. Your ${paymentIntent.planName || paymentIntent.planId || "subscription"} access is now active.`,
          });
        }
      } catch (smsError) {
        console.error("Success SMS error:", smsError);
      }
    } else {
      try {
        if (finalPhone) {
          await sendSms({
            mobile: String(finalPhone),
            message: `ReadyPips: Your M-Pesa payment was not completed. ${ResultDesc || "Please try again."}`,
          });
        }
      } catch (smsError) {
        console.error("Failure SMS error:", smsError);
      }
    }

    console.log("M-Pesa Callback Processed:", {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      amountKes: finalAmountKes,
      amountUsd: finalAmountUsd,
      mpesaReceiptNumber,
      transactionDate,
      phoneNumber: finalPhone,
      paymentIntentId: paymentIntent._id,
      finalStatus: isSuccessful ? "paid" : "failed",
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