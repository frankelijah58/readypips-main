import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { normalizePaymentChannel } from "@/lib/payment-provider";
import { computeMismatch, normalizeMoney } from "@/lib/payment-amounts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error("❌ [Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // console.log("🔍 [Stripe Webhook] Event received:", event.type);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      // console.log(
      //   "🔍 [Stripe Webhook] Checkout session completed:",
      //   session.id
      // );

      try {
        const db = await getDatabase();

        // Extract user ID, plan and payment reference from metadata
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const reference = session.metadata?.reference || null;

        if (!userId || !plan) {
          console.error("❌ [Stripe Webhook] Missing metadata:", {
            userId,
            plan,
          });
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 }
          );
        }

        const paidAmountUsd =
          normalizeMoney((session.amount_total || 0) / 100, 2) ?? 0;

        const intent = reference
          ? await db.collection("payment_intents").findOne({
              reference,
              status: { $in: ["pending", "initiated"] },
            })
          : null;
        const expectedAmountUsd =
          normalizeMoney(intent?.expectedAmountUsd ?? intent?.amountUsd ?? 0, 2) ??
          0;
        const amountMismatch = computeMismatch(
          paidAmountUsd,
          expectedAmountUsd,
          1,
          2
        );

        if (intent) {
          await db.collection("payment_intents").updateMany(
            {
              userId: intent.userId,
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

          await db.collection("payment_intents").updateOne(
            { _id: intent._id },
            {
              $set: {
                status: "success",
                processedAt: new Date(),
                amount: paidAmountUsd,
                currency: "USD",
                amountUsd: paidAmountUsd,
                currencyUsd: "USD",
                amount_paid_original: paidAmountUsd,
                currency_original: "USD",
                amount_converted: paidAmountUsd,
                exchange_rate_used: 1,
                expectedAmountUsd: expectedAmountUsd || null,
                amountMismatch,
                amountSource: "stripe_webhook",
                rawStripeWebhook: event,
                updatedAt: new Date(),
              },
            }
          );

          const existingSub = await db.collection("subscriptions").findOne({
            userId: intent.userId,
            status: "active",
          });
          let startDate = new Date();
          if (existingSub?.endDate && new Date(existingSub.endDate) > startDate) {
            startDate = new Date(existingSub.endDate);
          }
          const durationDays =
            intent.duration || (plan === "weekly" ? 7 : plan === "monthly" ? 30 : 365);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Number(durationDays || 30));

          await db.collection("subscriptions").updateOne(
            { userId: intent.userId },
            {
              $set: {
                userId: intent.userId,
                planId: intent.planId || plan,
                amount: paidAmountUsd,
                currency: "USD",
                amountUsd: paidAmountUsd,
                currencyUsd: "USD",
                amount_paid_original: paidAmountUsd,
                currency_original: "USD",
                amount_converted: paidAmountUsd,
                exchange_rate_used: 1,
                expectedAmountUsd: expectedAmountUsd || null,
                amountMismatch,
                provider: "stripe",
                paymentChannel: normalizePaymentChannel("stripe"),
                status: "active",
                startDate,
                endDate,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );

          await db.collection("users").updateOne(
            { _id: new ObjectId(String(intent.userId)) },
            {
              $set: {
                subscriptionStatus: "active",
                subscriptionType: intent.planId || plan,
                subscriptionEndDate: endDate,
                updatedAt: new Date(),
              },
            }
          );
        } else {
          await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                subscriptionStatus: "active",
                subscriptionType: plan,
                updatedAt: new Date(),
              },
            }
          );
        }

        return NextResponse.json({ received: true });
      } catch (error) {
        console.error(
          "❌ [Stripe Webhook] Error updating subscription:",
          error
        );
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }

    case "invoice.payment_succeeded":
      // console.log("🔍 [Stripe Webhook] Invoice payment succeeded");
      return NextResponse.json({ received: true });

    case "invoice.payment_failed":
      // console.log("🔍 [Stripe Webhook] Invoice payment failed");
      return NextResponse.json({ received: true });

    default:
      // console.log(`🔍 [Stripe Webhook] Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true });
  }
}
