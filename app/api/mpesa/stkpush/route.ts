import { NextRequest, NextResponse } from "next/server";
import { generateReference, initiateStkPush, normalizePhoneNumber } from "@/lib/mpesa";
import { PLANS } from "@/lib/plans";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken, findUserById } from "@/lib/auth";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    console.log("STK route hit");

    const body = await req.json();
    console.log("STK request body:", body);

    const { phoneNumber, amount, planId, planName, duration } = body;

    if (!phoneNumber || !amount || !planId) {
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

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Invalid token.",
        },
        { status: 401 }
      );
    }

    const planConfig = PLANS.find((p) => p.id === planId);
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

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const accountReference = generateReference("READYPIPS");
    const db = await getDatabase();

    await db.collection("payment_intents").insertOne({
      reference: accountReference,
      userId: decoded.userId,
      email: userEmail,
      planId,
      planName: planName || planConfig.name,
      duration: duration || planConfig.duration,
      provider: "mpesa",
      amount: Math.round(numericAmount),
      currency: "KES",
      phoneNumber: normalizedPhone,
      status: "pending",
      smsPromptSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const stk = await initiateStkPush({
      amount: Math.round(numericAmount),
      phoneNumber: normalizedPhone,
      accountReference,
      transactionDesc: planName
        ? `${planName} subscription`
        : `${planConfig.name} subscription`,
    });

    console.log("STK Safaricom response:", stk);

    await db.collection("payment_intents").updateOne(
      { reference: accountReference },
      {
        $set: {
          merchantRequestId: stk.MerchantRequestID || null,
          checkoutRequestId: stk.CheckoutRequestID || null,
          responseCode: stk.ResponseCode || null,
          responseDescription: stk.ResponseDescription || null,
          customerMessage: stk.CustomerMessage || null,
          rawStkResponse: stk,
          updatedAt: new Date(),
        },
      }
    );

    // Send SMS only after Safaricom accepts the STK request
    try {
      if (String(stk.ResponseCode) === "0") {
        const smsResult = await sendSms({
          mobile: normalizedPhone,
          message: `ReadyPips: We have sent an M-Pesa prompt for KES ${Math.round(
            numericAmount
          ).toLocaleString()}. Enter your PIN to complete payment for ${
            planName || planConfig.name
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
      }
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
      message: stk.CustomerMessage || "STK Push sent successfully.",
      data: {
        reference: accountReference,
        MerchantRequestID: stk.MerchantRequestID,
        CheckoutRequestID: stk.CheckoutRequestID,
        ResponseCode: stk.ResponseCode,
        ResponseDescription: stk.ResponseDescription,
        CustomerMessage: stk.CustomerMessage,
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