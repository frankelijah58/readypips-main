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

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment amount.",
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(incomingPhone);
    const accountReference = generateReference("READYPIPS");
    const db = await getDatabase();

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
      amount: Math.round(numericAmount),
      currency: currency || "KES",

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
      amount: Math.round(numericAmount),
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
          numericAmount
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