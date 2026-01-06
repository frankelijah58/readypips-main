import { NextRequest, NextResponse } from "next/server";
import { validatePaystackWebhook } from "@/lib/payments";
import { updateUserSubscription, findUser } from "@/lib/auth";

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
      const { customer, metadata } = data;

      // Find user by email
      const user = await findUser(customer.email);
      if (!user) {
        console.error("User not found for Paystack webhook:", customer.email);
        return NextResponse.json({ received: true });
      }

      // Extract plan ID from metadata
      const planId = metadata?.planId;
      if (!planId) {
        console.error("Plan ID not found in Paystack webhook metadata");
        return NextResponse.json({ received: true });
      }

      // Calculate subscription end date (30 days from now)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

      await updateUserSubscription(user._id!, {
        subscriptionStatus: "active",
        subscriptionType: planId as "basic" | "premium" | "pro",
        subscriptionEndDate,
      });

      console.log(
        `Paystack subscription activated for user ${user._id}, plan: ${planId}`
      );
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
