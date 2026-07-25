import { NextRequest, NextResponse } from "next/server";
import {
  findAdminByEmail,
  findPasswordResetToken,
  deletePasswordResetToken,
  verifyPasswordResetToken,
  updateAdmin,
} from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword, confirmPassword } = await request.json();

    if (!email || !token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Verify token format
    const tokenValid = verifyPasswordResetToken(token);
    if (!tokenValid.valid) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Find reset token in database
    const resetToken = await findPasswordResetToken(email, token, "admin");
    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Find admin
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Update password
    await updateAdmin(admin._id!, { password: newPassword });

    // Delete reset token
    await deletePasswordResetToken(email, token);

    return NextResponse.json(
      {
        message: "Password reset successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
