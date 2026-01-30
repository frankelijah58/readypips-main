import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, findAdminById } from "@/lib/admin";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

// import { verifyToken } from "@/lib/auth";
// import { getDatabase } from "@/lib/mongodb";
// import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = await getDatabase();
    
    // Aggregate to join user info with withdrawal requests
    const withdrawals = await db.collection("withdrawals").aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "partner"
        }
      },
      { $unwind: "$partner" },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          createdAt: 1,
          partnerEmail: "$partner.email",
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return NextResponse.json(withdrawals);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

