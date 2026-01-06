import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    // console.log('🔐 [Reset Password] Starting password reset process...');
    
    const body = await request.json();
    // console.log('🔐 [Reset Password] Request body:', {
    //   hasToken: !!body.token,
    //   tokenLength: body.token?.length,
    //   hasPassword: !!body.password,
    //   passwordLength: body.password?.length
    // });
    
    const { token, password } = body;

    if (!token || !password) {
      // console.log('❌ [Reset Password] Missing required fields');
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Verify token
    // console.log('🔐 [Reset Password] Verifying JWT token...');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      // console.log('✅ [Reset Password] Token verified:', { email: decoded.email });
    } catch (error: any) {
      // console.log('❌ [Reset Password] Token verification failed:', error.message);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    // console.log('🔐 [Reset Password] Database connected, checking reset record...');

    // Check if reset token exists and is valid
    const resetRecord = await db.collection('passwordResets').findOne({
      token: token,
      expiresAt: { $gt: new Date() }
    });

    // console.log('🔐 [Reset Password] Reset record found:', !!resetRecord);
    if (resetRecord) {
      console.log('🔐 [Reset Password] Reset record details:', {
        email: resetRecord.email,
        expiresAt: resetRecord.expiresAt
      });
    }

    if (!resetRecord) {
      // console.log('❌ [Reset Password] Reset record not found or expired');
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    // console.log('🔐 [Reset Password] Hashing new password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    // console.log('🔐 [Reset Password] Updating user password for:', resetRecord.email);
    const updateResult = await db.collection('users').updateOne(
      { email: resetRecord.email },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    // console.log('🔐 [Reset Password] Update result:', {
    //   matchedCount: updateResult.matchedCount,
    //   modifiedCount: updateResult.modifiedCount
    // });

    // Delete used reset token
    // console.log('🔐 [Reset Password] Deleting used reset token...');
    await db.collection('passwordResets').deleteOne({
      _id: resetRecord._id
    });

    // console.log('✅ [Reset Password] Password reset successfully!');
    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ [Reset Password] Error:", error);
    console.error("❌ [Reset Password] Error stack:", error.stack);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
