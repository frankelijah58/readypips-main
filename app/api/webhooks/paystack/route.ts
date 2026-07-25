import { NextRequest, NextResponse } from "next/server";
import { validatePaystackWebhook } from "@/lib/payments";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PLANS } from "@/lib/plans";
import { normalizePaymentChannel } from "@/lib/payment-provider";
import { computeMismatch, normalizeMoney } from "@/lib/payment-amounts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Paystack webhook signature missing");
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    if (!validatePaystackWebhook(body, signature)) {
      console.error("Invalid Paystack webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    if (body.event === "charge.success") {
      const { data } = body;
      const metadata = data?.metadata || {};
      const reference = String(data?.reference || metadata?.reference || "");
      if (!reference) {
        return NextResponse.json({ received: true });
      }

      const db = await getDatabase();
      const intent = await db.collection("payment_intents").findOne({
        reference,
        status: { $in: ["pending", "initiated", "submitted_waiting_admin_approval"] },
      });
      if (!intent) return NextResponse.json({ received: true });

      const normalizedIntentPlanId = String(intent.planId || "")
        .toLowerCase()
        .replace(/\s+/g, "");
      const plan = PLANS.find((p: any) => {
        const pid = String(p.id || "").toLowerCase().replace(/\s+/g, "");
        const ppid = String((p as any).planId || "")
          .toLowerCase()
          .replace(/\s+/g, "");
        const pname = String(p.name || "").toLowerCase().replace(/\s+/g, "");
        return (
          pid === normalizedIntentPlanId ||
          ppid === normalizedIntentPlanId ||
          pname === normalizedIntentPlanId
        );
      });
      if (!plan) return NextResponse.json({ received: true });

      const expectedAmountKes = normalizeMoney(intent.expectedAmountKes ?? plan.kes ?? 0, 2) ?? 0;
      const expectedAmountUsd = normalizeMoney(intent.expectedAmountUsd ?? plan.usd ?? 0, 2) ?? 0;
      const paidAmountKes = normalizeMoney((Number(data?.amount || 0) / 100), 2) ?? 0;
      const amountMismatch = computeMismatch(paidAmountKes, expectedAmountKes, 100, 2);

      await db.collection("payment_intents").updateOne(
        { _id: intent._id },
        {
          $set: {
            status: "success",
            processedAt: new Date(),
            amount: paidAmountKes,
            currency: "KES",
            amountKes: paidAmountKes,
            currencyKes: "KES",
            amountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
            currencyUsd: expectedAmountUsd > 0 ? "USD" : null,
            amount_paid_original: paidAmountKes,
            currency_original: "KES",
            amount_converted: paidAmountKes,
            exchange_rate_used: 1,
            expectedAmountKes: expectedAmountKes > 0 ? expectedAmountKes : null,
            expectedAmountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
            amountMismatch,
            amountSource: "paystack_webhook",
            paystackReference: data?.reference || null,
            rawPaystackWebhook: body,
            updatedAt: new Date(),
          },
        }
      );

      const userId = intent.userId;
      await db.collection("payment_intents").updateMany(
        {
          userId,
          _id: { $ne: intent._id },
          status: { $ne: "success" },
        },
        {
          $set: {
            status: "declined",
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      const existingSub = await db.collection("subscriptions").findOne({
        userId,
        status: "active",
      });
      let startDate = new Date();
      if (existingSub?.endDate && new Date(existingSub.endDate) > startDate) {
        startDate = new Date(existingSub.endDate);
      }
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Number(plan.duration || 30));

      await db.collection("subscriptions").updateOne(
        { userId },
        {
          $set: {
            userId,
            planId: intent.planId,
            amount: paidAmountKes,
            currency: "KES",
            amountKes: paidAmountKes,
            currencyKes: "KES",
            amountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
            currencyUsd: expectedAmountUsd > 0 ? "USD" : null,
            amount_paid_original: paidAmountKes,
            currency_original: "KES",
            amount_converted: paidAmountKes,
            exchange_rate_used: 1,
            expectedAmountKes: expectedAmountKes > 0 ? expectedAmountKes : null,
            expectedAmountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
            amountMismatch,
            provider: "paystack",
            paymentChannel: normalizePaymentChannel("paystack"),
            status: "active",
            startDate,
            endDate,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      if (ObjectId.isValid(String(userId || ""))) {
        await db.collection("users").updateOne(
          { _id: new ObjectId(String(userId)) },
          {
            $set: {
              subscriptionStatus: "active",
              subscriptionType: intent.planId,
              subscriptionEndDate: endDate,
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
