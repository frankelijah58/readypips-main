import { getDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // ─────────────────────────────────────────────
    // Auth
    // ─────────────────────────────────────────────
    const token = req.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    const decoded = verifyToken(token || "");

    // if (!decoded || decoded.role !== "admin") {
    //   return NextResponse.json(
    //     { error: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    const db = await getDatabase();

    // ─────────────────────────────────────────────
    // Fetch affiliates & partners only
    // ─────────────────────────────────────────────
    const users = await db
      .collection("users")
      .find({
        role: { $in: ["affiliate", "partner"] },
      })
      .toArray();

    // ─────────────────────────────────────────────
    // Normalize response per role
    // ─────────────────────────────────────────────
    const data = await Promise.all(
      users.map(async (user) => {
        const isPartner = user.role === "partner";
        const isAffiliate = user.role === "affiliate";

        const referralCode = isPartner
          ? user.partnerProfile?.referralCode
          : user.affiliateProfile?.referralCode;

        const referralCount = referralCode
          ? await db.collection("users").countDocuments({
              refereer: referralCode,
            })
          : 0;

        return {
          _id: user._id,
          email: user.email,
          role: user.role,

          referralCode,

          totalReferrals: referralCount,

          // Role-specific flags
          isApproved: isPartner
            ? user.partnerProfile?.isApproved ?? false
            : user.affiliateProfile?.isActive ?? false,

          tier: isPartner
            ? user.partnerProfile?.tier
            : null,

          commissionRate: isAffiliate
            ? user.affiliateProfile?.commissionRate
            : null,

          revenueShare: isPartner
            ? user.partnerProfile?.revenueShare
            : null,

          createdAt: user.createdAt,
        };
      })
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin partners fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}
