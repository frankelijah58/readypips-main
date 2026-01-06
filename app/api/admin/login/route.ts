import { NextRequest, NextResponse } from "next/server";
import {
  findAdminByEmail,
  verifyPassword,
  generateAdminToken,
  updateAdminLastLogin,
} from "@/lib/admin";
import { recordAdminAction } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Get IP address from headers
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await findAdminByEmail(email);
    if (!admin) {
      // console.log(`[Admin Login] No admin found for email: ${email}`);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // console.log(`[Admin Login] Admin found: ${admin.email}, role: ${admin.role}, active: ${admin.isActive}`);

    // Check if admin is active
    if (!admin.isActive) {
      return NextResponse.json(
        { error: "Admin account is inactive" },
        { status: 403 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, admin.password!);
    if (!passwordValid) {
      // console.log(`[Admin Login] Invalid password for: ${email}`);
      // Record failed login attempt
      await recordAdminAction(admin._id!, "failed_login", {
        email,
        ipAddress,
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // console.log(`[Admin Login] Password valid for: ${email}`);

    // Update last login
    await updateAdminLastLogin(admin._id!);

    // Generate token
    const token = generateAdminToken(admin._id!);

    // Record successful login
    await recordAdminAction(admin._id!, "login", {
      email,
      ipAddress,
    });

    // Remove password from response
    const { password: _, ...safeAdmin } = admin;

    const response = NextResponse.json(
      {
        message: "Login successful",
        admin: safeAdmin,
        token,
      },
      { status: 200 }
    );

    // Set auth cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
