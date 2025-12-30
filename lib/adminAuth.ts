import { verifyToken } from "./auth";
import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const token = authHeader.replace("Bearer ", "");
  const payload = verifyToken(token);
  if (!payload) throw new Error("Unauthorized");

  const db = await getDatabase();
  const admin = await db
    .collection("admins")
    .findOne({ _id: new ObjectId(payload.userId) });

  if (!admin) throw new Error("Forbidden");

  return admin;
}
