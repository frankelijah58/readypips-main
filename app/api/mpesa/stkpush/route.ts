import { NextRequest, NextResponse } from "next/server";
import {
  generateReference,
  initiateStkPush,
  normalizePhoneNumber,
} from "@/lib/mpesa";
import { PLANS } from "@/lib/plans";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken, findUserById } from "@/lib/auth";
import { sendSms } from "@/lib/sms";
import { getKesToUsdRate } from "@/lib/currency-rates";

function convertUsdToKes(usdAmount: number, kesToUsdRate: number): number {
  const numericUsd = Number(usdAmount);
  const numericRate = Number(kesToUsdRate);
  if (!Number.isFinite(numericUsd) || numericUsd <= 0) return 0;
  if (!Number.isFinite(numericRate) || numericRate <= 0) return 0;
  return Math.round(numericUsd / numericRate);
}

export async function POST(req: NextRequest) {
  try {
    console.log("STK route hit");

    const body = await req.json();
    console.log("STK request body:", body);

    const {
      phone,
      phoneNumber,
      amount,
      planId,
      planName,
      duration,
      currency,
      provider,
      userId: bodyUserId,
      smsPromptSent,
    } = body;

    const incomingPhone = phone || phoneNumber;

    if (!incomingPhone || !amount || !planId) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number, amount, and plan are required.",
        },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. No token provided.",
        },
        { status: 401 }
      );
    }

    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Invalid token.",
        },
        { status: 401 }
      );
    }

    const planConfig =
      PLANS.find(
        (p: any) =>
          p.id === planId ||
          p.planId === planId ||
          p.name?.toLowerCase().replace(/\s+/g, "") === planId
      ) || null;

    if (!planConfig) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid plan selected.",
        },
        { status: 400 }
      );
    }

    let userEmail = decoded.email || "";
    if (!userEmail && decoded.userId) {
      const user = await findUserById(decoded.userId);
      userEmail = user?.email || "";
    }

    const finalUserId = bodyUserId || decoded.userId || decoded.id || null;

    const db = await getDatabase();
    const fallbackAmountKes = Math.round(Number(planConfig.kes || 0));
    let canonicalPlanAmountKes = fallbackAmountKes;
    let fxRateKesToUsd: number | null = null;
    let fxSource: string | null = null;
    let fxFetchedAt: Date | null = null;

    try {
      const usdAmount = Number(planConfig.usd || 0);
      if (usdAmount > 0) {
        const fx = await getKesToUsdRate(db, { forceRefresh: true });
        const converted = convertUsdToKes(usdAmount, fx.rate);
        if (converted > 0) {
          canonicalPlanAmountKes = converted;
          fxRateKesToUsd = fx.rate;
          fxSource = fx.source;
          fxFetchedAt = fx.fetchedAt;
        }
      }
    } catch (fxErr) {
      console.error("STK live FX conversion failed, using fallback KES:", fxErr);
    }

    if (!Number.isFinite(canonicalPlanAmountKes) || canonicalPlanAmountKes <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan amount is not configured correctly.",
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(incomingPhone);
    const accountReference = generateReference("READYPIPS");

    const resolvedPlanName = planName || planConfig.name || null;
    const resolvedDuration =
      typeof duration === "number"
        ? duration
        : Number(duration) || planConfig.duration || null;

    await db.collection("payment_intents").insertOne({
      reference: accountReference,
      userId: finalUserId,
      email: userEmail,
      planId,
      planName: resolvedPlanName,
      duration: resolvedDuration,
      provider: provider || "mpesa",
      amount: canonicalPlanAmountKes,
      currency: "KES",
      amountKes: canonicalPlanAmountKes,
      currencyKes: "KES",
      amountUsd: Number(planConfig.usd || 0) || null,
      currencyUsd: Number(planConfig.usd || 0) > 0 ? "USD" : null,
      expectedAmountKes: canonicalPlanAmountKes,
      amountSource: fxRateKesToUsd ? "live_fx_from_plan_usd" : "plan_fallback_kes",
      fxRateKesToUsd,
      fxSource,
      fxFetchedAt,
      requestedAmount: Number.isFinite(Number(amount)) ? Number(amount) : null,
      requestedCurrency: currency || "KES",

      // normalized storage field
      phone: normalizedPhone,

      // keep compatibility with older code / old records
      phoneNumber: normalizedPhone,

      status: "pending",
      smsPromptSent: typeof smsPromptSent === "boolean" ? smsPromptSent : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const stk = await initiateStkPush({
      amount: canonicalPlanAmountKes,
      phoneNumber: normalizedPhone,
      accountReference,
      transactionDesc: resolvedPlanName
        ? `${resolvedPlanName} subscription`
        : `${planConfig.name} subscription`,
    });

    console.log("STK Safaricom response:", stk);

    const responseCode = String(stk?.ResponseCode ?? "");
    const isAccepted = responseCode === "0";

    await db.collection("payment_intents").updateOne(
      { reference: accountReference },
      {
        $set: {
          // normalized camel-case/ID fields
          merchantRequestID: stk?.MerchantRequestID || null,
          checkoutRequestID: stk?.CheckoutRequestID || null,

          // backward compatibility with older records/code
          merchantRequestId: stk?.MerchantRequestID || null,
          checkoutRequestId: stk?.CheckoutRequestID || null,

          responseCode: stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
          responseDescription: stk?.ResponseDescription || null,
          customerMessage: stk?.CustomerMessage || null,
          rawStkResponse: stk,
          status: isAccepted ? "pending" : "failed",
          updatedAt: new Date(),
        },
      }
    );

    if (!isAccepted) {
      return NextResponse.json(
        {
          success: false,
          message:
            stk?.ResponseDescription ||
            stk?.CustomerMessage ||
            "M-Pesa STK request was not accepted.",
          reference: accountReference,

          MerchantRequestID: stk?.MerchantRequestID || null,
          CheckoutRequestID: stk?.CheckoutRequestID || null,
          ResponseCode: stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
          ResponseDescription: stk?.ResponseDescription || null,
          CustomerMessage: stk?.CustomerMessage || null,

          merchantRequestID: stk?.MerchantRequestID || null,
          checkoutRequestID: stk?.CheckoutRequestID || null,
          responseCode: stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
          responseDescription: stk?.ResponseDescription || null,
          customerMessage: stk?.CustomerMessage || null,

          data: {
            reference: accountReference,
            MerchantRequestID: stk?.MerchantRequestID || null,
            CheckoutRequestID: stk?.CheckoutRequestID || null,
            ResponseCode:
              stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
            ResponseDescription: stk?.ResponseDescription || null,
            CustomerMessage: stk?.CustomerMessage || null,

            merchantRequestID: stk?.MerchantRequestID || null,
            checkoutRequestID: stk?.CheckoutRequestID || null,
            responseCode:
              stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
            responseDescription: stk?.ResponseDescription || null,
            customerMessage: stk?.CustomerMessage || null,
          },
        },
        { status: 400 }
      );
    }

    try {
      const smsResult = await sendSms({
        mobile: normalizedPhone,
        message: `ReadyPips: We have sent an M-Pesa prompt for KES ${Math.round(
          canonicalPlanAmountKes
        ).toLocaleString()}. Enter your PIN to complete payment for ${
          resolvedPlanName || planConfig.name
        }. Ref: ${accountReference}.`,
      });

      await db.collection("payment_intents").updateOne(
        { reference: accountReference },
        {
          $set: {
            smsPromptSent: smsResult.ok,
            smsPromptResponse: smsResult.data,
            smsPromptSentAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } catch (smsError: any) {
      console.error("Prompt SMS error:", smsError);

      await db.collection("payment_intents").updateOne(
        { reference: accountReference },
        {
          $set: {
            smsPromptSent: false,
            smsPromptError: smsError?.message || "Failed to send prompt SMS",
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: stk?.CustomerMessage || "STK Push sent successfully.",
      reference: accountReference,

      // top-level fields for frontend compatibility
      MerchantRequestID: stk?.MerchantRequestID || null,
      CheckoutRequestID: stk?.CheckoutRequestID || null,
      ResponseCode: stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
      ResponseDescription: stk?.ResponseDescription || null,
      CustomerMessage: stk?.CustomerMessage || null,

      // normalized lower camel case too
      merchantRequestID: stk?.MerchantRequestID || null,
      checkoutRequestID: stk?.CheckoutRequestID || null,
      responseCode: stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
      responseDescription: stk?.ResponseDescription || null,
      customerMessage: stk?.CustomerMessage || null,

      // nested data kept too
      data: {
        reference: accountReference,
        MerchantRequestID: stk?.MerchantRequestID || null,
        CheckoutRequestID: stk?.CheckoutRequestID || null,
        ResponseCode: stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
        ResponseDescription: stk?.ResponseDescription || null,
        CustomerMessage: stk?.CustomerMessage || null,

        merchantRequestID: stk?.MerchantRequestID || null,
        checkoutRequestID: stk?.CheckoutRequestID || null,
        responseCode: stk?.ResponseCode != null ? String(stk.ResponseCode) : null,
        responseDescription: stk?.ResponseDescription || null,
        customerMessage: stk?.CustomerMessage || null,
      },
    });
  } catch (error: any) {
    console.error("STK Push route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to send STK push.",
      },
      { status: 500 }
    );
  }
}