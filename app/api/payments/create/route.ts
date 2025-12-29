import crypto from "crypto";
import { PLANS } from "@/lib/plans";
import { getDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth"; // Ensure this is exported from your auth lib

export async function POST(req: NextRequest) {
  try {
    const { planId, provider } = await req.json();

    // 1. Validate Plan
    const planConfig = PLANS.find(p => p.id === planId);
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // 2. Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const reference = crypto.randomUUID();
    const db = await getDatabase();

    // 3. Log Intent
    await db.collection("payment_intents").insertOne({
      reference,
      userId: decoded.userId,
      planId,
      provider,
      amount: planConfig.usd,
      currency: "USD",
      status: "pending",
      createdAt: new Date(),
    });

    // 4. Provider Specific Logic
    switch (provider) {
      case "whop":
        // Whop usually uses specific product links or their API
        // This constructs a checkout link with your reference as a pass-through
        return NextResponse.json({
          checkoutUrl: `https://whop.com/checkout/YOUR_PRODUCT_ID?custom_id=${reference}`
        });

      case "binance":
        // For Binance, you typically call their Create Order API here first
        // and return the universal checkout URL they provide.
        return NextResponse.json({
          checkoutUrl: `https://pay.binance.com/en/checkout?merchantTradeNo=${reference}&totalFee=${planConfig.usd}&currency=USDT`
        });

      default:
        return NextResponse.json({ error: "Provider not supported" }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment Creation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
// import crypto from "crypto";
// import { PLANS } from "@/lib/plans";
// import { getDatabase } from "@/lib/mongodb";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   type PlanKey = keyof typeof PLANS;
//   type Provider = "stripe" | "paystack" | "pesapal" | "whop" | "binance";

//   const { plan, provider } = (await req.json()) as {
//     plan: PlanKey;
//     provider: Provider;
//   };

//   const planConfig = PLANS.find(p => p.id === plan);

//   if (!planConfig) {
//     return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
//   }

//   // Get user from authorization header
//   const authHeader = req.headers.get("authorization");
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const token = authHeader.substring(7);

//   // Verify token and get user
//   const { verifyToken } = await import("@/lib/auth");
//   const decoded = await verifyToken(token);

//   if (!decoded) {
//     return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//   }

//   const reference = crypto.randomUUID();
//   const db = await getDatabase();

//   await db.collection("payment_intents").insertOne({
//     reference,
//     userId: decoded.userId,
//     planId: plan,
//     provider,
//     amount: provider === "stripe" ? planConfig.usd : planConfig.kes,
//     currency: provider === "stripe" ? "USD" : "KES",
//     status: "pending",
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   });

//   // Route to your EXISTING endpoints
//   switch (provider) {
//     case "stripe":
//       return redirectTo("/api/checkout/stripe", { plan, reference });

//     case "paystack":
//       return redirectTo("/api/checkout/paystack", { plan, reference });

//     case "pesapal":
//       return redirectTo("/api/checkout/pesapal", { plan, reference });

//     case "whop":
//       return redirectToWhop(reference, planConfig);

//     case "binance":
//       return redirectToBinance(reference, planConfig);
//   }
// }

// function redirectToWhop(reference: string, plan: any) {
//   return NextResponse.json({
//     url:
//       "https://whop.com/checkout?" +
//       new URLSearchParams({
//         amount: plan.usd.toString(),
//         currency: "USD",
//         reference,
//       }),
//   });
// }

// function redirectToBinance(reference: string, plan: any) {
//   return NextResponse.json({
//     url:
//       "https://pay.binance.com/en/checkout?" +
//       new URLSearchParams({
//         merchantTradeNo: reference,
//         totalFee: plan.usd.toString(),
//         currency: "USDT",
//       }),
//   });
// }

// function redirectTo(endpoint: string, data: Record<string, any>) {
//   return NextResponse.json({
//     url:
//       endpoint +
//       "?" +
//       new URLSearchParams(
//         Object.fromEntries(
//           Object.entries(data).map(([key, value]) => [key, value.toString()])
//         )
//       ),
//   });
// }