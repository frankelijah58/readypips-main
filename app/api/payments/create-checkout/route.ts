import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import Stripe from "stripe";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const {
      plan,
      successUrl: requestSuccessUrl,
      cancelUrl: requestCancelUrl,
      provider,
    } = await request.json();

    // Ensure this endpoint only handles Stripe payments
    if (provider && provider !== "stripe") {
      return NextResponse.json(
        { error: "This endpoint only handles Stripe payments" },
        { status: 400 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token and get user
    const { verifyToken } = await import("@/lib/auth");
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);

    // Check if user already has an active subscription
    const existingUser = await db.collection("users").findOne({
      _id: userId,
      subscriptionStatus: "active",
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "You already have an active subscription. Please contact support to change your plan.",
          hasActiveSubscription: true,
        },
        { status: 400 }
      );
    }

    // Define plan prices
    const planPrices = {
      weekly: 1300, // $13.00 in cents
      monthly: 2900, // $29.00 in cents
      annually: 12900, // $129.00 in cents
    };

    const price = planPrices[plan as keyof typeof planPrices];
    if (!price) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get user email for pre-filling
    const user = await db.collection("users").findOne({ _id: userId });

    // Test environment variable
    // console.log("🔍 [Create Checkout] Environment test:");
    // console.log("  - NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    // console.log("  - NODE_ENV:", process.env.NODE_ENV);
    // console.log(
    //   "  - Fallback URL:",
    //   process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    // );
 
    const finalSuccessUrl =
      requestSuccessUrl ||
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/signals/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl =
      requestCancelUrl ||
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/subscription`;

    // Ensure the success URL has the correct format
    if (!finalSuccessUrl.includes("{CHECKOUT_SESSION_ID}")) {
      console.log(
        "⚠️ [Create Checkout] Warning: Success URL missing session ID placeholder"
      );
    }

    // console.log("🔍 [Create Checkout] Success URL:", finalSuccessUrl);
    // console.log("🔍 [Create Checkout] Cancel URL:", finalCancelUrl);
    // console.log(
    //   "🔍 [Create Checkout] NEXT_PUBLIC_APP_URL:",
    //   process.env.NEXT_PUBLIC_APP_URL
    // );

    // Determine billing interval based on plan
    const getBillingInterval = (planType: string) => {
      switch (planType) {
        case "weekly":
          return "week";
        case "monthly":
          return "month";
        case "annually":
          return "year";
        default:
          return "month";
      }
    };

    const billingInterval = getBillingInterval(plan);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `Ready Pips ${
                plan.charAt(0).toUpperCase() + plan.slice(1)
              } Subscription`,
            },
            unit_amount: price,
            recurring: {
              interval: billingInterval,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        userId: decoded.userId,
        plan: plan,
      },
      customer_email: user?.email, // Pre-fill email if available
    });

    // Now construct the actual success URL with the real session ID
    const actualSuccessUrl = finalSuccessUrl.replace(
      "{CHECKOUT_SESSION_ID}",
      session.id
    );

    // console.log("🔍 [Create Checkout] Stripe session created:", {
    //   id: session.id,
    //   url: session.url,
    //   success_url: session.success_url,
    //   cancel_url: session.cancel_url,
    //   metadata: session.metadata,
    // });

    // Log the actual redirect URL that Stripe will use
    // console.log(
    //   "🔍 [Create Checkout] Expected redirect URL:",
    //   actualSuccessUrl
    // );

    // Test URL construction
    // console.log("🔍 [Create Checkout] Test URL construction:");
    // console.log("  - Original:", finalSuccessUrl);
    // console.log("  - With session ID:", actualSuccessUrl);
    // console.log("  - Session ID:", session.id);

    // Also log what Stripe actually returns for success_url
    // console.log(
    //   "🔍 [Create Checkout] Stripe's success_url:",
    //   session.success_url
    // );

    // Check if Stripe's success_url matches our expected URL
    if (session.success_url !== actualSuccessUrl) {
      console.log(
        "⚠️ [Create Checkout] Warning: Stripe's success_url doesn't match expected URL"
      );
      // console.log("  - Expected:", actualSuccessUrl);
      // console.log("  - Actual:", session.success_url);
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
