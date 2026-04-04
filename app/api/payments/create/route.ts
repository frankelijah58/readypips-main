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

type Provider = "whop" | "binance" | "mpesa" | "paystack";

function getWhopCheckoutUrl(plan: any, email?: string, reference?: string) {
  if (!plan.whopCheckoutUrl) {
    throw new Error("Whop checkout URL is not configured for this plan");
  }

  const url = new URL(plan.whopCheckoutUrl);

  if (reference) {
    url.searchParams.set("custom_id", reference);
  }

  if (email) {
    url.searchParams.set("email", email);
  }

  return url.toString();
}

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
        p.planId === planId ||
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

    const decoded: any = await verifyToken(token);

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
        planId: planConfig.id,
        planName: planConfig.name,
        duration: planConfig.duration,
        provider: "whop",
        amount: Number(planConfig.usd || 0),
        currency: "USD",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const checkoutUrl = getWhopCheckoutUrl(
        planConfig,
        decoded.email,
        reference
      );

      await db.collection("payment_intents").updateOne(
        { reference },
        {
          $set: {
            checkoutUrl,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        checkoutUrl,
        reference,
        provider: "whop",
        planId: planConfig.id,
        planName: planConfig.name,
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
        planId: planConfig.id,
        planName: planConfig.name,
        duration: planConfig.duration,
        provider: "paystack",
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
              planId: planConfig.id,
              planName: planConfig.name,
              duration: planConfig.duration,
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
            paystackAccessCode: paystackData.data?.access_code || null,
            paystackReference: paystackData.data?.reference || null,
            rawPaystackResponse: paystackData,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        reference,
        provider: "paystack",
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
        planId: planConfig.id,
        planName: planConfig.name,
        duration: planConfig.duration,
        provider: "binance",
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
          referenceGoodsId: planConfig.id,
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

        return NextResponse.json(
          { error: "Binance Order Creation Failed" },
          { status: 400 }
        );
      }

      await db.collection("payment_intents").updateOne(
        { reference },
        {
          $set: {
            rawBinanceResponse: binanceData,
            checkoutUrl: binanceData.data?.checkoutUrl || null,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        reference,
        provider: "binance",
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
        planId: planConfig.id,
        userId: decoded.userId,
      });

      const amount = Math.round(Number(planConfig.kes || 0));

      const existing = await db.collection("payment_intents").findOne({
        userId: decoded.userId,
        provider: "mpesa",
        status: "pending",
        createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) },
      });

      if (existing) {
        console.log("REUSING EXISTING MPESA PENDING:", {
          reference: existing.reference,
          merchantRequestID:
            existing.merchantRequestID || existing.merchantRequestId,
          checkoutRequestID:
            existing.checkoutRequestID || existing.checkoutRequestId,
        });

        return NextResponse.json({
          success: true,
          message: "You already have a pending payment. Check your phone.",
          reference: existing.reference,
          MerchantRequestID:
            existing.merchantRequestID || existing.merchantRequestId || null,
          CheckoutRequestID:
            existing.checkoutRequestID || existing.checkoutRequestId || null,
          merchantRequestID:
            existing.merchantRequestID || existing.merchantRequestId || null,
          checkoutRequestID:
            existing.checkoutRequestID || existing.checkoutRequestId || null,
          customerMessage:
            existing.customerMessage || "Pending payment found",
          reusedPending: true,
        });
      }

      await db.collection("payment_intents").insertOne({
        reference,
        userId: decoded.userId,
        email: decoded.email,
        planId: planConfig.id,
        planName: planConfig.name,
        duration: planConfig.duration,
        provider: "mpesa",
        amount,
        currency: "KES",
        phone: formattedPhone,
        phoneNumber: formattedPhone,
        status: "pending",
        smsPromptSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const auth = Buffer.from(
        `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
      ).toString("base64");

      const baseUrl =
        process.env.MPESA_ENV === "sandbox"
          ? "https://sandbox.safaricom.co.ke"
          : "https://api.safaricom.co.ke";

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

        return NextResponse.json(
          { error: "Failed to get M-Pesa token" },
          { status: 500 }
        );
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

      if (String(stkData?.ResponseCode) !== "0") {
        console.error("M-Pesa STK Error:", stkData);

        await db.collection("payment_intents").updateOne(
          { reference },
          {
            $set: {
              status: "failed",
              failureReason: stkData?.ResponseDescription || "STK Push failed",
              rawStkResponse: stkData,
              responseCode:
                stkData?.ResponseCode != null
                  ? String(stkData.ResponseCode)
                  : null,
              responseDescription: stkData?.ResponseDescription || null,
              customerMessage: stkData?.CustomerMessage || null,
              updatedAt: new Date(),
            },
          }
        );

        return NextResponse.json(
          {
            error: stkData?.ResponseDescription || "STK Push failed",
            MerchantRequestID: stkData?.MerchantRequestID || null,
            CheckoutRequestID: stkData?.CheckoutRequestID || null,
            merchantRequestID: stkData?.MerchantRequestID || null,
            checkoutRequestID: stkData?.CheckoutRequestID || null,
            customerMessage: stkData?.CustomerMessage || null,
          },
          { status: 400 }
        );
      }

      await db.collection("payment_intents").updateOne(
        { reference },
        {
          $set: {
            paymentIntentId: reference,

            merchantRequestID: stkData?.MerchantRequestID || null,
            checkoutRequestID: stkData?.CheckoutRequestID || null,

            merchantRequestId: stkData?.MerchantRequestID || null,
            checkoutRequestId: stkData?.CheckoutRequestID || null,

            responseCode:
              stkData?.ResponseCode != null
                ? String(stkData.ResponseCode)
                : null,
            responseDescription: stkData?.ResponseDescription || null,
            customerMessage: stkData?.CustomerMessage || null,
            rawStkResponse: stkData,
            updatedAt: new Date(),
          },
        }
      );

      console.log("MPESA SUCCESS RETURN:", {
        merchantRequestID: stkData?.MerchantRequestID,
        checkoutRequestID: stkData?.CheckoutRequestID,
        customerMessage: stkData?.CustomerMessage,
      });

      return NextResponse.json({
        success: true,
        message: stkData?.CustomerMessage || "STK Push sent",
        reference,

        MerchantRequestID: stkData?.MerchantRequestID || null,
        CheckoutRequestID: stkData?.CheckoutRequestID || null,
        ResponseCode:
          stkData?.ResponseCode != null ? String(stkData.ResponseCode) : null,
        ResponseDescription: stkData?.ResponseDescription || null,
        CustomerMessage: stkData?.CustomerMessage || null,

        merchantRequestID: stkData?.MerchantRequestID || null,
        checkoutRequestID: stkData?.CheckoutRequestID || null,
        responseCode:
          stkData?.ResponseCode != null ? String(stkData.ResponseCode) : null,
        responseDescription: stkData?.ResponseDescription || null,
        customerMessage: stkData?.CustomerMessage || null,
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