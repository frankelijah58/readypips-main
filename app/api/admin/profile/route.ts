import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminToken,
  findAdminById,
  updateAdmin,
  verifyPassword,
} from "@/lib/admin";

function jsonSafeAdmin(admin: NonNullable<Awaited<ReturnType<typeof findAdminById>>>) {
  const { password: _, ...safe } = admin;
  return safe;
}

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
    if (!admin || admin.isActive === false) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        admin: jsonSafeAdmin(admin),
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

export async function PATCH(request: NextRequest) {
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
    if (!admin || admin.isActive === false) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      currentPassword,
      newPassword,
    } = body as {
      firstName?: string;
      lastName?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const wantsPassword =
      typeof newPassword === "string" && newPassword.length > 0;
    const wantsName =
      typeof firstName === "string" ||
      typeof lastName === "string";

    if (wantsPassword && wantsName) {
      return NextResponse.json(
        { error: "Update name or password in separate requests" },
        { status: 400 }
      );
    }

    if (wantsPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }
      if (!admin.password) {
        return NextResponse.json(
          { error: "Password login is not set for this account" },
          { status: 400 }
        );
      }
      const valid = await verifyPassword(currentPassword, admin.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      const updated = await updateAdmin(admin._id!, {
        password: newPassword,
      });
      if (!updated) {
        return NextResponse.json(
          { error: "Could not update password" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        message: "Password updated",
        admin: jsonSafeAdmin(updated),
      });
    }

    if (wantsName) {
      const nextFirst =
        typeof firstName === "string" ? firstName.trim() : admin.firstName;
      const nextLast =
        typeof lastName === "string" ? lastName.trim() : admin.lastName;

      if (!nextFirst || !nextLast) {
        return NextResponse.json(
          { error: "First and last name are required" },
          { status: 400 }
        );
      }

      const updated = await updateAdmin(admin._id!, {
        firstName: nextFirst,
        lastName: nextLast,
      });
      if (!updated) {
        return NextResponse.json(
          { error: "Could not update profile" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        message: "Profile updated",
        admin: jsonSafeAdmin(updated),
      });
    }

    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
