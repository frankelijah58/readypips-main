import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { initializePesapal, subscriptionPlans } from "@/lib/payments";

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

    // Get user details for Pesapal
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get exact KES amounts for each plan (no conversion, use exact amounts)
    const kesAmounts: Record<string, number> = {
      weekly: 700,       // KES 700
      monthly: 1000,     // KES 1,000
      "3months": 1500,   // KES 1,500
    };

    const amountInKes = kesAmounts[planId] || subscriptionPlan.price;

    try {
      // console.log("🔍 [Create Pesapal] Initializing Pesapal transaction with:", {
      //   planId,
      //   planName: subscriptionPlan.name,
      //   priceUSD: subscriptionPlan.price,
      //   amountInKes,
      //   userEmail: user.email,
      //   userPhone: user.phoneNumber || user.phone || "+254700000000",
      //   userFirstName: user.firstName || "User",
      //   userLastName: user.lastName || "Name",
      // });

      // Initialize Pesapal transaction
      const pesapalResponse = await initializePesapal(
        planId,
        user.email,
        user.phoneNumber || user.phone || "+254700000000", // Default phone if not provided
        user.firstName || "User",
        user.lastName || "Name",
        amountInKes
      );

      // console.log("✅ [Create Pesapal] Pesapal response:", pesapalResponse);

      // Store payment record in database
      const paymentRecord = {
        userId: decoded.userId,
        sessionId: pesapalResponse.order_tracking_id,
        provider: "pesapal",
        planId: planId,
        planName: subscriptionPlan.name,
        amount: subscriptionPlan.price,
        currency: "USD",
        status: "pending",
        paymentData: pesapalResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("payments").insertOne(paymentRecord);

      return NextResponse.json({
        url: pesapalResponse.redirect_url,
        order_tracking_id: pesapalResponse.order_tracking_id,
      });
    } catch (error) {
      console.error("Pesapal initialization error:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a credential issue
      if (errorMessage.includes("credentials not configured")) {
        return NextResponse.json(
          { error: "Pesapal credentials not configured. Please contact support." },
          { status: 500 }
        );
      }
      
      // Check if it's an API endpoint issue
      if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
        return NextResponse.json(
          { error: "Pesapal service temporarily unavailable. Please try Paystack or Stripe instead." },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to initialize Pesapal payment. Please try another payment method." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating Pesapal session:", error);
    return NextResponse.json(
      { error: "Failed to create Pesapal session" },
      { status: 500 }
    );
  }
}
