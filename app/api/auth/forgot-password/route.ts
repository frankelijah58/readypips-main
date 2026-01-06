import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDatabase } from "@/lib/mongodb";
import { sendEmail, emailTemplates } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    // console.log('🔍 [Forgot Password] Starting password reset process...');
    // console.log('🔍 [Forgot Password] Environment variables check:');
    // console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    // console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
    // console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
    // console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '***EXISTS***' : 'NOT SET');
    // console.log('  SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || 'NOT SET');
    // console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'NOT SET');
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Check if user exists
    const user = await db.collection('users').findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: "If an account with that email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Check if email is verified before allowing password reset
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before resetting your password." },
        { status: 400 }
      );
    }

    // Delete any existing reset tokens for this email
    await db.collection('passwordResets').deleteMany({
      email: user.email
    });

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    // Store reset token in database
    await db.collection('passwordResets').insertOne({
      email: user.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      createdAt: new Date()
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email using NodeMailer
    const emailSent = await sendEmail({
      to: user.email,
      ...emailTemplates.passwordReset(user.firstName || 'there', resetUrl)
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Password reset link sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to send reset link" },
      { status: 500 }
    );
  }
}
