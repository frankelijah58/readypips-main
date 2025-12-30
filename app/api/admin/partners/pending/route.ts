import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const db = await getDatabase();

    const partners = await db
      .collection("users")
      .find({
        role: "partner",
        "partnerProfile.isApproved": false,
      })
      .project({
        password: 0,
      })
      .sort({ "partnerProfile.appliedAt": -1 })
      .toArray();

    return NextResponse.json({ partners });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unauthorized" },
      { status: 403 }
    );
  }
}
