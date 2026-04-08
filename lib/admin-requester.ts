import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

export type AdminRequesterRow = {
  isAdmin?: boolean;
  role?: string;
} | null;

export function hasAdminPrivileges(u: AdminRequesterRow): boolean {
  if (!u) return false;
  if (u.isAdmin === true) return true;
  const r = String(u.role || "").toLowerCase();
  return (
    r === "admin" ||
    r === "super_admin" ||
    r === "superadmin" ||
    r === "moderator"
  );
}

/** Resolve dashboard admin: `users` row or `admins` collection by JWT `userId`. */
export async function resolveAdminRequester(
  userId: string,
): Promise<AdminRequesterRow> {
  const db = await getDatabase();
  let row = await db.collection("users").findOne({
    _id: new ObjectId(userId),
  });
  if (!row) {
    row = await db.collection("users").findOne({
      _id: userId as unknown as ObjectId,
    });
  }
  if (!row) {
    const admin =
      (await db.collection("admins").findOne({
        _id: new ObjectId(userId),
      })) ||
      (await db.collection("admins").findOne({
        _id: userId as unknown as ObjectId,
      }));
    if (admin) {
      return {
        ...admin,
        isAdmin: true,
        role: (admin as { role?: string }).role || "admin",
      } as AdminRequesterRow;
    }
    return null;
  }
  return row as AdminRequesterRow;
}
