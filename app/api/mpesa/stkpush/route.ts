import { NextRequest, NextResponse } from "next/server";
import { generateReference, initiateStkPush } from "@/lib/mpesa";

type PlanMap = {
  [key: string]: {
    name: string;
    amount: number;
  };
};

const plans: PlanMap = {
  monthly: { name: "Monthly", amount: 6370 },
  quarterly: { name: "Quarterly", amount: 15999 },
  lifetime: { name: "Lifetime", amount: 39999 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, planId, userId } = body;

    if (!phoneNumber || !planId) {
      return NextResponse.json(
        { success: false, message: "Phone number and plan are required." },
        { status: 400 }
      );
    }

    const plan = plans[planId];
    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Invalid plan selected." },
        { status: 400 }
      );
    }

    const accountReference = generateReference("READYPIPS");

    const stk = await initiateStkPush({
      amount: plan.amount,
      phoneNumber,
      accountReference,
      transactionDesc: `${plan.name} subscription`,
    });

    /**
     * Save pending payment to your DB here
     * Example fields:
     * - userId
     * - planId
     * - amount
     * - phoneNumber
     * - accountReference
     * - MerchantRequestID
     * - CheckoutRequestID
     * - status: "pending"
     * - rawRequest / rawResponse
     */

    return NextResponse.json({
      success: true,
      message: stk.CustomerMessage || "STK Push sent successfully.",
      data: {
        MerchantRequestID: stk.MerchantRequestID,
        CheckoutRequestID: stk.CheckoutRequestID,
        ResponseCode: stk.ResponseCode,
        ResponseDescription: stk.ResponseDescription,
        CustomerMessage: stk.CustomerMessage,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send STK push.",
      },
      { status: 500 }
    );
  }
}