import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { updateUserSubscription } from "@/lib/auth";
import { PLANS } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data } = body;

    // We look for 'payment.succeeded' or 'membership.went_active' or 'membership.activated'
    // Whop passes our UUID in the 'custom_id' field
    if (event === "membership.went_active" || event === "payment.succeeded" || event === "membership.activated" || 
      event === "payment.completed" || event === "subscription.activated" || event === "subscription.went_active" || 
      event === "subscription.completed" || event === "order.completed" || event === "order.paid"
    ) {
      const reference = data.custom_id; 
      const db = await getDatabase();

      // 1. Find the pending intent in your DB
      const intent = await db.collection("payment_intents").findOne({ 
        reference: reference,
        status: "pending" 
      });

      if (!intent) {
        return NextResponse.json({ error: "Intent not found" }, { status: 404 });
      }

      // 2. Get the plan details to calculate duration
      const planConfig = PLANS.find(p => p.id === intent.planId);
      if (!planConfig) throw new Error("Plan config not found");

      const durationDays = planConfig.duration;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // 3. Update the User in the DB
      await updateUserSubscription(intent.userId, {
        subscriptionStatus: "active",
        subscriptionType: intent.planId as any, // e.g., 'basic', 'premium'
        subscriptionEndDate: endDate,
        subscriptionStartDate: new Date(),
      });

      // 4. Mark intent as completed
      await db.collection("payment_intents").updateOne(
        { reference: reference },
        { $set: { status: "completed", updatedAt: new Date() } }
      );

      console.log(`✅ Subscription activated for user ${intent.userId}`);
    }
    else if (event === "membership.canceled" || event === "subscription.canceled") {
      const reference = data.custom_id; 
      const db = await getDatabase();

      // Find the intent in your DB
      const intent = await db.collection("payment_intents").findOne({ 
        reference: reference 
      });

      if (!intent) {
        return NextResponse.json({ error: "Intent not found" }, { status: 404 });
      }

      // Update the User in the DB to cancel subscription
      // await updateUserSubscription(intent.userId, {
      //   subscriptionStatus: "canceled",
      //   subscriptionEndDate: new Date(),
      // });

      console.log(`✅ Subscription canceled for user ${intent.userId}`);
    }


    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}