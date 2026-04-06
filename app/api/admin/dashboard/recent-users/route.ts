import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdminDashboardAccess } from "@/lib/admin-dashboard-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminDashboardAccess(req);
    if (!auth.ok) return auth.response;

    const db = await getDatabase();

    const users = await db
      .collection("users")
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "subscriptions",
            let: { uid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toString: "$userId" }, { $toString: "$$uid" }],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: "subscription",
          },
        },
        { $unwind: { path: "$subscription", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            userName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ["$firstName", ""] },
                    " ",
                    { $ifNull: ["$lastName", ""] },
                  ],
                },
              },
            },
            userEmail: "$email",
            planType: {
              $ifNull: [
                "$subscription.planId",
                {
                  $ifNull: ["$subscription.plan", "Free"],
                },
              ],
            },
            joinedDate: "$createdAt",
          },
        },
      ])
      .toArray();

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Recent users error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
