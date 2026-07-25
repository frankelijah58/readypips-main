import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";
import { AdminRole, verifyAdminToken, findAdminById } from "@/lib/admin";
import { getDatabase } from "@/lib/mongodb";

/**
 * Dashboard is opened with the same JWT as /api/auth/verify (users collection, isAdmin).
 * Some routes incorrectly required verifyAdminToken only; this accepts either pattern.
 */
export async function requireAdminDashboardAccess(
  req: NextRequest
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userDecoded = verifyToken(token);
  if (userDecoded?.userId) {
    try {
      const db = await getDatabase();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(userDecoded.userId),
      });
      if (
        user &&
        (user.isAdmin === true ||
          user.role === "admin" ||
          user.role === "superadmin" ||
          user.role === "super_admin")
      ) {
        return { ok: true };
      }
    } catch {
      /* fall through */
    }
  }

  const adminDecoded = verifyAdminToken(token);
  if (adminDecoded?.adminId) {
    const admin = await findAdminById(adminDecoded.adminId);
    const roleOk =
      admin?.role === AdminRole.SUPER_ADMIN || admin?.role === AdminRole.ADMIN;
    if (admin?.isActive && (admin.isAdmin === true || roleOk)) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}
