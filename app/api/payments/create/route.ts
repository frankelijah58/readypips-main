import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;

const BINANCE_PAY_KEY = process.env.BINANCE_PAY_KEY;
const BINANCE_PAY_SECRET = process.env.BINANCE_PAY_SECRET;
const BINANCE_PAY_CERT = process.env.BINANCE_PAY_CERT;
const WHOP_APP_ID = process.env.NEXT_PUBLIC_WHOP_APP_ID;

type Provider = "whop" | "binance" | "mpesa" | "paystack";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, provider, phone } = body as {
      planId: string;
      provider: Provider;
      phone?: string;
    };

    if (!planId || !provider) {
      return NextResponse.json(
        { error: "planId and provider are required" },
        { status: 400 }
      );
    }

    const planConfig = PLANS.find(
      (p: any) =>
        p.id === planId ||
        p.name?.toLowerCase().replace(/\s+/g, "") === planId
    );

    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const reference = crypto.randomUUID();

    if (provider === "whop") {
      await db.collection("payment_intents").insertOne({
        reference,
        userId: decoded.userId,
        email: decoded.email,
        planId,
        provider,
        amount: Number(planConfig.usd || 0),
        currency: "USD",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (!WHOP_APP_ID) {
        return NextResponse.json(
          { error: "Whop is not configured" },
          { status: 500 }
        );
      }

      const whopUrl = new URL(`https://whop.com/checkout/${WHOP_APP_ID}`);
      whopUrl.searchParams.append("custom_id", reference);

      if (decoded.email) {
        whopUrl.searchParams.append("email", decoded.email);
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: whopUrl.toString(),
        reference,
      });
    }

    if (provider === "paystack") {
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      const APP_URL =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      if (!PAYSTACK_SECRET_KEY) {
        return NextResponse.json(
          { error: "Paystack is not configured" },
          { status: 500 }
        );
      }

      const amountKes = Math.round(Number(planConfig.kes || 0));
      //const amountKes = 5; // TEST MODE
      const email = decoded.email;

      if (!email) {
        return NextResponse.json(
          { error: "User email is required for Paystack" },
          { status: 400 }
        );
      }

      await db.collection("payment_intents").insertOne({
        reference,
        userId: decoded.userId,
        email: decoded.email,
        planId,
        provider,
        amount: amountKes,
        currency: "KES",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const paystackRes = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            amount: amountKes * 100,
            currency: "KES",
            reference,
            callback_url: `${APP_URL}/payment/success?reference=${reference}`,
            metadata: {
              planId,
              userId: decoded.userId,
              provider: "paystack",
            },
          }),
        }
      );

      const paystackData = await paystackRes.json();

      if (!paystackRes.ok || !paystackData.status) {
        console.error("Paystack init error:", paystackData);

        await db.collection("payment_intents").updateOne(
          { reference },
          {
            $set: {
              status: "failed",
              failureReason:
                paystackData?.message || "Paystack initialization failed",
              rawPaystackResponse: paystackData,
              updatedAt: new Date(),
            },
          }
        );

        return NextResponse.json(
          { error: paystackData?.message || "Paystack initialization failed" },
          { status: 400 }
        );
      }

      await db.collection("payment_intents").updateOne(
        { reference },
        {
          $set: {
            provider: "paystack",
            paystackAccessCode: paystackData.data?.access_code,
            paystackReference: paystackData.data?.reference,
            rawPaystackResponse: paystackData,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        reference,
        checkoutUrl: paystackData.data.authorization_url,
      });
    }

    if (provider === "binance") {
      if (!BINANCE_PAY_KEY || !BINANCE_PAY_SECRET || !BINANCE_PAY_CERT) {
        return NextResponse.json(
          { error: "Binance Pay is not configured" },
          { status: 500 }
        );
      }

      await db.collection("payment_intents").insertOne({
        reference,
        userId: decoded.userId,
        email: decoded.email,
        planId,
        provider,
        amount: Number(planConfig.usd || 0),
        currency: "USD",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const nonce = crypto.randomUUID().replace(/-/g, "");
      const timestamp = Date.now().toString();
      const endpoint =
        "https://bpay.binanceapi.com/binancepay/openapi/v3/order";

      const payload = {
        env: {
          terminalType: "WEB",
        },
        merchantTradeNo: reference,
        orderAmount: Number(planConfig.usd || 0),
        currency: "USDT",
        goods: {
          goodsType: "01",
          goodsCategory: "D000",
          referenceGoodsId: planId,
          goodsName: `ReadyPips ${planConfig.name}`,
          goodsDetail: `Subscription ${planConfig.name}`,
        },
      };

      const bodyString = JSON.stringify(payload);
      const signaturePayload = `${timestamp}\n${nonce}\n${bodyString}\n`;

      const signature = crypto
        .createHmac("sha512", BINANCE_PAY_SECRET)
        .update(signaturePayload)
        .digest("hex")
        .toUpperCase();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "BinancePay-Timestamp": timestamp,
          "BinancePay-Nonce": nonce,
          "BinancePay-Certificate-SN": BINANCE_PAY_CERT,
          "BinancePay-Signature": signature,
          "BinancePay-Key": BINANCE_PAY_KEY,
        },
        body: bodyString,
      });

      const binanceData = await response.json();

      if (binanceData.status !== "SUCCESS") {
        console.error("Binance Error:", binanceData);

        await db.collection("payment_intents").updateOne(
          { reference },
          {
            $set: {
              status: "failed",
              failureReason: "Binance Order Creation Failed",
              rawBinanceResponse: binanceData,
              updatedAt: new Date(),
            },
          }
        );

        throw new Error("Binance Order Creation Failed");
      }

      await db.collection("payment_intents").updateOne(
        { reference },
        {
          $set: {
            provider: "binance",
            rawBinanceResponse: binanceData,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        reference,
        checkoutUrl: binanceData.data.checkoutUrl,
      });
    }

    if (provider === "mpesa") {
      if (!phone) {
        return NextResponse.json(
          { error: "Phone number required" },
          { status: 400 }
        );
      }

      const formattedPhone = phone.startsWith("0")
        ? "254" + phone.substring(1)
        : phone.startsWith("254")
          ? phone
          : `254${phone}`;

      console.log("MPESA INPUT:", {
        phone,
        formattedPhone,
        planId,
        userId: decoded.userId,
      });

      const amount = Math.round(Number(planConfig.kes || 0));
      //const amount = 5; // TEST MODE
      // Check for an existing pending payment BEFORE creating a new one
      const existing = await db.collection("payment_intents").findOne({
        userId: decoded.userId,
        provider: "mpesa",
        status: "pending",
        createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) },
      });

      if (existing) {
        console.log("REUSING EXISTING MPESA PENDING:", {
          reference: existing.reference,
          merchantRequestID: existing.merchantRequestID,
          checkoutRequestID: existing.checkoutRequestID,
        });

        return NextResponse.json({
          success: true,
          message: "You already have a pending payment. Check your phone.",
          reference: existing.reference,
          merchantRequestID: existing.merchantRequestID,
          checkoutRequestID: existing.checkoutRequestID,
          customerMessage:
            existing.customerMessage || "Pending payment found",
          reusedPending: true,
        });
      }

      // Create the payment intent only after confirming no pending one exists
      await db.collection("payment_intents").insertOne({
        reference,
        userId: decoded.userId,
        email: decoded.email,
        planId,
        provider,
        amount,
        currency: "KES",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const auth = Buffer.from(
        `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
      ).toString("base64");

      const baseUrl = "https://api.safaricom.co.ke";

      const tokenRes = await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      const tokenData = await tokenRes.json();
      console.log("MPESA TOKEN RESPONSE:", tokenData);

      const accessToken = tokenData.access_token;

      if (!accessToken) {
        await db.collection("payment_intents").updateOne(
          { reference },
          {
            $set: {
              status: "failed",
              failureReason: "Failed to get M-Pesa token",
              rawTokenResponse: tokenData,
              updatedAt: new Date(),
            },
          }
        );

        console.error("M-Pesa Token Error:", tokenData);
        throw new Error("Failed to get M-Pesa token");
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14);

      const password = Buffer.from(
        `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
      ).toString("base64");

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
          setTimeout(() => reject(new Error("STK timeout")), 15000)
        ),
      ]);

      const stkData = await (stkResponse as Response).json();
      console.log("MPESA STK RESPONSE:", stkData);

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
          }
        );

        throw new Error(stkData.ResponseDescription || "STK Push failed");
      }

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
        }
      );

      console.log("MPESA SUCCESS RETURN:", {
        merchantRequestID: stkData.MerchantRequestID,
        checkoutRequestID: stkData.CheckoutRequestID,
        customerMessage: stkData.CustomerMessage,
      });

      return NextResponse.json({
        success: true,
        message: stkData.CustomerMessage || "STK Push sent",
        reference,
        merchantRequestID: stkData.MerchantRequestID,
        checkoutRequestID: stkData.CheckoutRequestID,
        customerMessage: stkData.CustomerMessage,
      });
    }

    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Server Error" },
      { status: 500 }
    );
  }
}