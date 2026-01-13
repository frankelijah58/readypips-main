import { getDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth"; // Ensure your auth logic checks for role === 'admin'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    // if (decoded?.role !== "admin") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const db = await getDatabase();

    // Fetch all partners/affiliates
    const partners = await db.collection("users").find({
      role: { $in: ["partner", "affiliate"] }
    }).toArray();

    // Map through partners to get their referral counts and status
    const partnerData = await Promise.all(partners.map(async (p) => {
      const referralCount = await db.collection("users").countDocuments({ 
        refereer: p.partnerProfile?.referralCode 
      });
      
      return {
        _id: p._id,
        email: p.email,
        role: p.role,
        referralCode: p.partnerProfile?.referralCode,
        totalReferrals: referralCount,
        createdAt: p.createdAt
      };
    }));

    return NextResponse.json(partnerData);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}