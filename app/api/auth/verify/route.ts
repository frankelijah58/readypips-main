import { NextRequest, NextResponse } from "next/server";
import { verifyToken, findUserById } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check for token in Authorization header first, then in request body
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || (await request.json()).token;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      valid: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
