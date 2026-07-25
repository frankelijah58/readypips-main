import { NextRequest, NextResponse } from "next/server";
import {
  findAdminByEmail,
  generatePasswordResetToken,
  storePasswordResetToken,
} from "@/lib/admin";
import { sendAdminPasswordResetEmail } from "@/lib/email-notifications";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if admin exists
    const admin = await findAdminByEmail(email);
    if (!admin) {
      // Return success anyway for security (don't leak if email exists)
      return NextResponse.json(
        {
          message:
            "If an admin account exists with this email, a reset link has been sent",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();

    // Store reset token
    await storePasswordResetToken(email, resetToken, "admin");

    // Send password reset email using email notification service
    const emailSent = await sendAdminPasswordResetEmail(
      email,
      resetToken,
      admin.firstName
    );

    if (!emailSent) {
      console.warn(`Failed to send password reset email to ${email}`);
      // Still return success to avoid leaking info, but log the failure
    }

    return NextResponse.json(
      {
        message:
          "If an admin account exists with this email, a reset link has been sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin password reset request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
