import crypto from "crypto";
import { PLANS } from "@/lib/plans";
import { getDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, findUserById } from "@/lib/auth"; // Add findUserById

// Binance configuration
const BINANCE_PAY_CERT = process.env.BINANCE_PAY_CERT; // API Key
const BINANCE_PAY_SECRET = process.env.BINANCE_PAY_SECRET; // Secret Key
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;
const MPESA_ENV = process.env.MPESA_ENV;

export async function POST(req: NextRequest) {
  try {
    const { planId, provider } = await req.json();

    const planConfig = PLANS.find((p) => p.id === planId);
    if (!planConfig)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.substring(7);

    if (!token)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fallback: If email isn't in token, fetch from DB
    let userEmail = decoded.email;
    if (!userEmail) {
      const user = await findUserById(decoded.userId);
      userEmail = user?.email || "";
    }

    const reference = crypto.randomUUID();
    const db = await getDatabase();

    await db.collection("payment_intents").insertOne({
      reference,
      userId: decoded.userId,
      email: userEmail,
      planId,
      provider,
      amount: planConfig.usd,
      status: "pending",
      createdAt: new Date(),
    });

    if (provider === "whop") {
      // 1. Fetch the Plan ID from your plan config
      // You need to find the plan_XXXX ID from your Whop Dashboard -> Checkout Links
      const planConfig = PLANS.find((p) => p.id === planId);
      const whopPlanId = planConfig?.whopPlanId; // Ensure this is in your plans.ts

      // 2. Request a session from Whop
      const response = await fetch(
        "https://api.whop.com/api/v2/checkout_sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_id: whopPlanId,
            email: decoded.email, // Pre-fills for the user
            metadata: {
              custom_id: reference, // This comes back in the webhook later
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
            // redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success`
          }),
        },
      );

      const session = await response.json();

      if (!response.ok) {
        console.error("Whop Session Error:", session);
        throw new Error("Could not create Whop session");
      }

      // 3. Return the specific URL Whop generated for this user
      // session.purchase_url
      console.log("Whop Checkout URL:", session.purchase_url);
      return NextResponse.json({ checkoutUrl: session.purchase_url });
    }

    // if (provider === "whop") {
    //   const whopUrl = new URL(`https://whop.com/checkout/${process.env.NEXT_PUBLIC_WHOP_APP_ID}`);
    //   whopUrl.searchParams.append("custom_id", reference);
    //   // Pre-fill email so the user doesn't have to type it again
    //   if (userEmail) whopUrl.searchParams.append("email", userEmail);

    //   return NextResponse.json({ checkoutUrl: whopUrl.toString() });
    // }

    if (provider === "binance") {
      const endpoint =
        "https://bpay.binanceapi.com/binancepay/openapi/v2/order";

      // Binance requires a 32-character random string for the Nonce
      const nonce = crypto.randomBytes(16).toString("hex"); // 32 hex chars
      const timestamp = Date.now().toString();

      const orderBody = {
        env: { terminalType: "WEB" },
        merchantTradeNo: reference,
        orderAmount: planConfig?.usd,
        currency: "USDT",
        goods: {
          goodsType: "02", // Use "02" for Virtual Goods (Subscriptions)
          goodsCategory: "6000",
          referenceGoodsId: planId,
          goodsName: `Ready Pips ${planConfig?.name}`,
          goodsDetail: `Subscription for ${planConfig?.duration} days`,
        },
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
      };

      const bodyString = JSON.stringify(orderBody);

      // Signature Payload format must be exact: timestamp + \n + nonce + \n + body + \n
      const payload = `${timestamp}\n${nonce}\n${bodyString}\n`;

      const signature = crypto
        .createHmac("sha512", process.env.BINANCE_PAY_SECRET!)
        .update(payload)
        .digest("hex")
        .toUpperCase();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "BinancePay-Timestamp": timestamp,
          "BinancePay-Nonce": nonce,
          "BinancePay-Certificate-SN": process.env.BINANCE_PAY_CERT!, // THE FIX
          "BinancePay-Signature": signature,
        },
        body: bodyString,
      });

      const binanceData = await response.json();

      if (binanceData.status === "SUCCESS") {
        // Log to MongoDB
        const db = await getDatabase();
        await db.collection("payment_intents").insertOne({
          reference,
          userId: decoded.userId,
          planId,
          provider: "binance",
          amount: planConfig?.usd,
          status: "pending",
          createdAt: new Date(),
        });

        return NextResponse.json({ checkoutUrl: binanceData.data.checkoutUrl });
      } else {
        console.error("Binance Error:", binanceData);
        throw new Error("Binance Order Creation Failed");
      }
    }

    if (provider === "1binancev1") {
      return NextResponse.json({
        checkoutUrl: `https://pay.binance.com/en/checkout?merchantTradeNo=${reference}&totalFee=${planConfig.usd}&currency=USDT&terminalType=WEB`,
      });
    }

    if (provider === "mpesa") {
      const body = await req.json();
      const phone = body.phone;

      if (!phone) {
        return NextResponse.json(
          { error: "Phone number required" },
          { status: 400 },
        );
      }

      // ✅ Normalize phone properly
      const formattedPhone = phone.startsWith("0")
        ? "254" + phone.substring(1)
        : phone.startsWith("254")
          ? phone
          : `254${phone}`;

      const amount = Math.round(planConfig.kes); // ✅ NEVER trust frontend

      // 🛑 Prevent duplicate STK spam (2 min window)
      const existing = await db.collection("payment_intents").findOne({
        userId: decoded.userId,
        provider: "mpesa",
        status: "pending",
        createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) },
      });

      if (existing) {
        return NextResponse.json({
          error: "You already have a pending payment. Check your phone.",
        });
      }

      // 1️⃣ Generate OAuth Token
      const auth = Buffer.from(
        `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`,
      ).toString("base64");

      const baseUrl = "https://api.safaricom.co.ke";
      // MPESA_ENV === "production"
      //   ? "https://api.safaricom.co.ke"
      //   : "https://sandbox.safaricom.co.ke";

      const tokenRes = await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        console.error("M-Pesa Token Error:", tokenData);
        throw new Error("Failed to get M-Pesa token");
      }

      // 2️⃣ Generate Timestamp & Password
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14);

      const password = Buffer.from(
        `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`,
      ).toString("base64");

      // 3️⃣ STK PUSH (with timeout protection)
      const stkResponse = await Promise.race([
        fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: MPESA_SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: MPESA_CALLBACK_URL,
            AccountReference: reference,
            TransactionDesc: `Subscription ${planConfig.name}`,
          }),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("STK timeout")), 15000),
        ),
      ]);

      const stkData = await (stkResponse as Response).json();

      console.log("M-Pesa STK Response:", stkData);

      if (stkData.ResponseCode !== "0") {
        console.error("M-Pesa STK Error:", stkData);

        await db.collection("payment_intents").updateOne(
          { reference },
          {
            $set: {
              status: "failed",
              failureReason: stkData.ResponseDescription,
              rawStkResponse: stkData,
              updatedAt: new Date(),
            },
          },
        );

        throw new Error(stkData.ResponseDescription || "STK Push failed");
      }

      // ✅ Save STK identifiers
      await db.collection("payment_intents").updateOne(
        { reference },
        {
          $set: {
            provider: "mpesa",
            phone: formattedPhone,
            planId,
            amount,
            paymentIntentId: reference,
            checkoutRequestID: stkData.CheckoutRequestID,
            merchantRequestID: stkData.MerchantRequestID,
            responseCode: stkData.ResponseCode,
            responseDescription: stkData.ResponseDescription,
            customerMessage: stkData.CustomerMessage,
            rawStkResponse: stkData,
            updatedAt: new Date(),
          },
        },
      );

      // 📲 Optional: SMS hook (recommended)
      try {
        // await sendSms({...})
      } catch (e) {
        console.error("SMS error:", e);
      }

      return NextResponse.json({
        success: true,
        message: stkData.CustomerMessage || "STK Push sent",
        data: {
          reference,
          checkoutRequestID: stkData.CheckoutRequestID,
        },
      });
    }

    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// import crypto from "crypto";
// import { PLANS } from "@/lib/plans";
// import { getDatabase } from "@/lib/mongodb";
// import { NextRequest, NextResponse } from "next/server";
// import { verifyToken } from "@/lib/auth";

// export async function POST(req: NextRequest) {
//   try {
//     const { planId, provider } = await req.json();

//     const planConfig = PLANS.find(p => p.id === planId);
//     if (!planConfig) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.substring(7);
//     const decoded = await verifyToken(token!);

//     if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const reference = crypto.randomUUID();
//     const db = await getDatabase();

//     // Save initial intent
//     await db.collection("payment_intents").insertOne({
//       reference,
//       userId: decoded.userId,
//       email: decoded.email, // Passing user email is crucial for reconciliation
//       planId,
//       provider,
//       amount: planConfig.usd,
//       status: "pending",
//       createdAt: new Date(),
//     });

//     if (provider === "whop") {
//       // Instead of a hardcoded product ID, we use the Whop Checkout link
//       // with your App ID and pass user details as query params
//       const whopUrl = new URL(`https://whop.com/checkout/${process.env.NEXT_PUBLIC_WHOP_APP_ID}`);
//       whopUrl.searchParams.append("custom_id", reference);
//       whopUrl.searchParams.append("email", decoded.email);
//       // If your Whop plans are setup, you can map them here:
//       // whopUrl.searchParams.append("plan", planId);

//       return NextResponse.json({ checkoutUrl: whopUrl.toString() });
//     }

//     if (provider === "binance") {
//       // Binance Pay requires a specific API call to get a 'checkoutUrl'
//       // This is a simplified version of the Binance Pay 'Create Order' flow
//       return NextResponse.json({
//         checkoutUrl: `https://pay.binance.com/en/checkout?merchantTradeNo=${reference}&totalFee=${planConfig.usd}&currency=USDT&terminalType=WEB`
//       });
//     }

//   } catch (error) {
//     return NextResponse.json({ error: "Server Error" }, { status: 500 });
//   }
// }
// import crypto from "crypto";
// import { PLANS } from "@/lib/plans";
// import { getDatabase } from "@/lib/mongodb";
// import { NextRequest, NextResponse } from "next/server";
// import { verifyToken } from "@/lib/auth"; // Ensure this is exported from your auth lib

// export async function POST(req: NextRequest) {
//   try {
//     const { planId, provider } = await req.json();

//     // 1. Validate Plan
//     const planConfig = PLANS.find(p => p.id === planId);
//     if (!planConfig) {
//       return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
//     }

//     // 2. Auth Check
//     const authHeader = req.headers.get("authorization");
//     if (!authHeader?.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const token = authHeader.substring(7);
//     const decoded = await verifyToken(token);
//     if (!decoded) {
//       return NextResponse.json({ error: "Session expired" }, { status: 401 });
//     }

//     const reference = crypto.randomUUID();
//     const db = await getDatabase();

//     // 3. Log Intent
//     await db.collection("payment_intents").insertOne({
//       reference,
//       userId: decoded.userId,
//       planId,
//       provider,
//       amount: planConfig.usd,
//       currency: "USD",
//       status: "pending",
//       createdAt: new Date(),
//     });

//     // 4. Provider Specific Logic
//     switch (provider) {
//       case "whop":
//         // Whop usually uses specific product links or their API
//         // This constructs a checkout link with your reference as a pass-through
//         return NextResponse.json({
//           checkoutUrl: `https://whop.com/checkout/YOUR_PRODUCT_ID?custom_id=${reference}`
//         });

//       case "binance":
//         // For Binance, you typically call their Create Order API here first
//         // and return the universal checkout URL they provide.
//         return NextResponse.json({
//           checkoutUrl: `https://pay.binance.com/en/checkout?merchantTradeNo=${reference}&totalFee=${planConfig.usd}&currency=USDT`
//         });

//       default:
//         return NextResponse.json({ error: "Provider not supported" }, { status: 400 });
//     }
//   } catch (error) {
//     console.error("Payment Creation Error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }
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
