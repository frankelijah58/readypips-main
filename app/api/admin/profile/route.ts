import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, findAdminById } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyAdminToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const admin = await findAdminById(decoded.adminId);
    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    const { password: _, ...safeAdmin } = admin;

    return NextResponse.json(
      {
        admin: safeAdmin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
