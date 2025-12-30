import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: "user",
          updatedAt: new Date(),
        },
        $unset: {
          partnerProfile: "",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Rejection failed" },
      { status: 500 }
    );
  }
}
