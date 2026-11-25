import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { generateReference } from "@/lib/payments";
import { PLANS } from "@/lib/plans";
import { normalizePaymentChannel } from "@/lib/payment-provider";

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { verifyToken } = await import("@/lib/auth");
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const normalizedPlan = String(plan || "")
      .toLowerCase()
      .replace(/\s+/g, "");
    const planConfig = PLANS.find((p: any) => {
      const pid = String(p.id || "").toLowerCase().replace(/\s+/g, "");
      const pname = String(p.name || "").toLowerCase().replace(/\s+/g, "");
      return pid === normalizedPlan || pname === normalizedPlan;
    });

    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const amountKes = Math.round(Number(planConfig.kes || 0));
    const amountUsd = Number(planConfig.usd || 0);
    if (!Number.isFinite(amountKes) || amountKes <= 0) {
      return NextResponse.json(
        { error: "Plan KES amount is not configured" },
        { status: 400 }
      );
    }

    const reference = generateReference("paystack");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountKes * 100,
        currency: "KES",
        reference,
        callback_url: `${appUrl}/subscription/success`,
        metadata: {
          provider: "paystack",
          planId: planConfig.id,
          planName: planConfig.name,
          userId: decoded.userId,
          reference,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status || !data.data?.authorization_url) {
      return NextResponse.json(
        { error: data?.message || "Failed to initialize Paystack payment" },
        { status: 500 }
      );
    }

    const now = new Date();
    await db.collection("payment_intents").insertOne({
      reference: data.data.reference || reference,
      userId: decoded.userId,
      email: user.email,
      planId: planConfig.id,
      planName: planConfig.name,
      duration: planConfig.duration,
      provider: "paystack",
      paymentChannel: normalizePaymentChannel("paystack"),
      amount: amountKes,
      currency: "KES",
      amountKes,
      currencyKes: "KES",
      amountUsd: amountUsd > 0 ? amountUsd : null,
      currencyUsd: amountUsd > 0 ? "USD" : null,
      expectedAmountKes: amountKes,
      expectedAmountUsd: amountUsd > 0 ? amountUsd : null,
      status: "pending",
      checkoutUrl: data.data.authorization_url,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      url: data.data.authorization_url,
      reference: data.data.reference || reference,
    });
  } catch (error) {
    console.error("Error creating Paystack session:", error);
    return NextResponse.json(
      { error: "Failed to create Paystack session" },
      { status: 500 }
    );
  }
}
