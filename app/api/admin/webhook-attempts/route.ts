import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    /* ------------------------------------
       1️⃣ Authorization
    ------------------------------------ */
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = await getDatabase();

    /* ------------------------------------
       2️⃣ Verify admin permissions
    ------------------------------------ */
    const adminUser = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
    });

    if (
      !adminUser ||
      (!adminUser.isAdmin &&
        adminUser.role !== "admin" &&
        adminUser.role !== "superadmin")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    /* ------------------------------------
       3️⃣ Query params
    ------------------------------------ */
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    /* ------------------------------------
       4️⃣ Build filter
    ------------------------------------ */
    const filter: any = {};

    if (search) {
      filter.$or = [
        { event: { $regex: search, $options: "i" } },
        { reference: { $regex: search, $options: "i" } },
      ];
    }

    /* ------------------------------------
       5️⃣ Fetch webhook attempts
    ------------------------------------ */
    const attempts = await db
      .collection("whop_webhook_attempts")
      .find(filter, {
        projection: {
          payload: 0, // hide heavy payload by default
          headers: 0,
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db
      .collection("whop_webhook_attempts")
      .countDocuments(filter);

    /* ------------------------------------
       6️⃣ Response
    ------------------------------------ */
    return NextResponse.json(
      {
        data: attempts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin webhook attempts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
