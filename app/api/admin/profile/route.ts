import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  verifyAdminToken,
  findAdminById,
  updateAdmin,
  verifyPassword,
} from "@/lib/admin";
import { verifyToken, findUserById, hashPassword } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

function bearerToken(request: NextRequest): string | null {
  const raw = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  return raw || null;
}

/** Resolves the logged-in principal for admin-area profile APIs (admins collection or users with admin access). */
async function resolveAdminPrincipal(token: string) {
  const decoded = verifyAdminToken(token);
  if (!decoded) return null;

  const fromAdmins = await findAdminById(decoded.adminId);
  if (fromAdmins && fromAdmins.isActive) {
    return { source: "admins" as const, id: decoded.adminId, admin: fromAdmins };
  }

  const userDecoded = verifyToken(token);
  if (!userDecoded?.userId) return null;
  const user = await findUserById(userDecoded.userId);
  if (!user) return null;
  const canAccess =
    user.isAdmin === true ||
    !!(user as { role?: string }).role;
  if (!canAccess) return null;

  return { source: "users" as const, id: user._id!, user };
}

export async function GET(request: NextRequest) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const principal = await resolveAdminPrincipal(token);
    if (!principal) {
      return NextResponse.json(
        { error: "Admin not found or inactive" },
        { status: 404 }
      );
    }

    if (principal.source === "admins") {
      const { password: _, ...safeAdmin } = principal.admin;
      return NextResponse.json({ admin: safeAdmin }, { status: 200 });
    }

    const u = principal.user;
    return NextResponse.json(
      {
        admin: {
          _id: u._id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: (u as { role?: string }).role,
          isAdmin: u.isAdmin,
        },
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
    const token = bearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const principal = await resolveAdminPrincipal(token);
    if (!principal) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, currentPassword, newPassword } = body as {
      firstName?: string;
      lastName?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    if (
      firstName === undefined &&
      lastName === undefined &&
      !newPassword
    ) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    if (newPassword !== undefined) {
      if (!currentPassword || typeof newPassword !== "string") {
        return NextResponse.json(
          { error: "Current password and new password are required" },
          { status: 400 }
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }
    }

    if (principal.source === "admins") {
      const admin = principal.admin;
      if (newPassword) {
        const ok = await verifyPassword(
          currentPassword!,
          admin.password || ""
        );
        if (!ok) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      const updated = await updateAdmin(principal.id, {
        ...(firstName !== undefined ? { firstName: String(firstName) } : {}),
        ...(lastName !== undefined ? { lastName: String(lastName) } : {}),
        ...(newPassword ? { password: newPassword } : {}),
      });

      if (!updated) {
        return NextResponse.json(
          { error: "Update failed" },
          { status: 500 }
        );
      }
      const { password: _, ...safe } = updated;
      return NextResponse.json({ admin: safe, message: "Profile updated" });
    }

    const user = principal.user;
    const hashed = user.password;

    if (newPassword) {
      const ok = await verifyPassword(currentPassword!, hashed || "");
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    const db = await getDatabase();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (firstName !== undefined) updates.firstName = String(firstName);
    if (lastName !== undefined) updates.lastName = String(lastName);
    if (newPassword) updates.password = await hashPassword(newPassword);

    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(principal.id) }, { $set: updates });

    return NextResponse.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
