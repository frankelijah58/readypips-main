import { NextRequest, NextResponse } from "next/server";
import { queryStkPush } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { checkoutRequestId } = body;

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, message: "checkoutRequestId is required" },
        { status: 400 }
      );
    }

    const result = await queryStkPush({
      checkoutRequestId,
    });

    /**
     * Optionally update DB status here if result confirms paid
     */

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Query failed" },
      { status: 500 }
    );
  }
}