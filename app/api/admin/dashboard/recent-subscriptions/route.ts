import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAdminDashboardAccess } from "@/lib/admin-dashboard-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminDashboardAccess(request);
    if (!auth.ok) return auth.response;

    const db = await getDatabase();

    const subscriptions = await db
      .collection("subscriptions")
      .aggregate([
        {
          $addFields: {
            userOid: {
              $convert: {
                input: "$userId",
                to: "objectId",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userOid",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 1,
            userName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ["$user.firstName", ""] },
                    " ",
                    { $ifNull: ["$user.lastName", ""] },
                  ],
                },
              },
            },
            userEmail: { $ifNull: ["$user.email", ""] },
            plan: { $ifNull: ["$plan", "$planId"] },
            price: { $ifNull: ["$price", "$amount", 0] },
            status: 1,
            startDate: 1,
            endDate: 1,
            createdAt: 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json({ subscriptions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recent subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
