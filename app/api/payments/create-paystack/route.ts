import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { initializePaystack, subscriptionPlans } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const { plan, successUrl, cancelUrl } = await request.json();

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

    // Map plan names to subscription plan IDs
    const planMapping: Record<string, string> = {
      weekly: "weekly",
      monthly: "monthly",
      "3 months": "3months",
      "3months": "3months",
    };

    const planId = planMapping[plan.toLowerCase()];
    if (!planId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get the subscription plan details
    const subscriptionPlan = subscriptionPlans.find((p) => p.id === planId);
    if (!subscriptionPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 400 });
    }

    // Get user email for Paystack
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get exact KES amounts for each plan (in kobo - smallest unit for Paystack)
    const kesAmounts: Record<string, number> = {
      weekly: 70000,       // KES 700 * 100 (in kobo)
      monthly: 100000,     // KES 1,000 * 100 (in kobo)
      "3months": 150000,   // KES 1,500 * 100 (in kobo)
    };

    const amountInKes = kesAmounts[planId] || Math.round(subscriptionPlan.price * 100);

    try {
      // Initialize Paystack transaction
      const paystackResponse = await initializePaystack(
        planId,
        user.email,
        amountInKes
      );

      // Store payment record in database
      const paymentRecord = {
        userId: decoded.userId,
        sessionId: paystackResponse.reference,
        provider: "paystack",
        planId: planId,
        planName: subscriptionPlan.name,
        amount: subscriptionPlan.price,
        currency: "USD",
        status: "pending",
        paymentData: paystackResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("payments").insertOne(paymentRecord);

      return NextResponse.json({
        url: paystackResponse.authorization_url,
        reference: paystackResponse.reference,
      });
    } catch (error) {
      console.error("Paystack initialization error:", error);
      return NextResponse.json(
        { error: "Failed to initialize Paystack payment" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating Paystack session:", error);
    return NextResponse.json(
      { error: "Failed to create Paystack session" },
      { status: 500 }
    );
  }
}
