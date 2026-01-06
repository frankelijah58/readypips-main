import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
        "🔍 [Stripe Webhook] Checkout session completed:",
        session.id
      );

      try {
        const db = await getDatabase();

        // Extract user ID and plan from metadata
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

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

        // Update user subscription status
        const result = await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              subscriptionStatus: "active",
              subscriptionType: plan,
              updatedAt: new Date(),
            },
          }
        );

        // console.log(
          "✅ [Stripe Webhook] User subscription updated:",
          result.modifiedCount
        );

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
