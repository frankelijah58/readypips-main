import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

function isSuccessLikeStatus(status: unknown): boolean {
  const s = String(status || "").toLowerCase();
  return ["success", "paid", "completed", "active"].includes(s);
}

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

    const references = Array.from(
      new Set(attempts.map((a: any) => a.reference).filter(Boolean))
    );

    const intents = references.length
      ? await db
          .collection("payment_intents")
          .find(
            { reference: { $in: references } },
            {
              projection: {
                _id: 1,
                reference: 1,
                userId: 1,
                status: 1,
                planId: 1,
                provider: 1,
                updatedAt: 1,
              },
            }
          )
          .toArray()
      : [];

    const latestIntentByRef = new Map<string, any>();
    for (const intent of intents) {
      const ref = String(intent.reference || "");
      const prev = latestIntentByRef.get(ref);
      if (!prev) {
        latestIntentByRef.set(ref, intent);
      } else {
        const prevTs = new Date(prev.updatedAt || 0).getTime();
        const curTs = new Date(intent.updatedAt || 0).getTime();
        if (curTs >= prevTs) {
          latestIntentByRef.set(ref, intent);
        }
      }
    }

    const intentUserIds = Array.from(
      new Set(
        Array.from(latestIntentByRef.values())
          .map((i: any) => String(i.userId || ""))
          .filter(Boolean)
      )
    );

    const subs = intentUserIds.length
      ? await db
          .collection("subscriptions")
          .find(
            { userId: { $in: intentUserIds } },
            { projection: { userId: 1, status: 1, endDate: 1, updatedAt: 1 } }
          )
          .toArray()
      : [];
    const latestSubByUserId = new Map<string, any>();
    for (const s of subs) {
      const key = String(s.userId || "");
      const prev = latestSubByUserId.get(key);
      if (!prev) latestSubByUserId.set(key, s);
      else {
        const prevTs = new Date(prev.updatedAt || 0).getTime();
        const curTs = new Date(s.updatedAt || 0).getTime();
        if (curTs >= prevTs) latestSubByUserId.set(key, s);
      }
    }

    const objectIdUserIds = intentUserIds.filter((id) => ObjectId.isValid(id));
    const usersById = objectIdUserIds.length
      ? await db
          .collection("users")
          .find(
            { _id: { $in: objectIdUserIds.map((id) => new ObjectId(id)) } },
            { projection: { subscriptionStatus: 1, subscriptionType: 1 } }
          )
          .toArray()
      : [];
    const userSubStatusByUserId = new Map<string, any>();
    for (const u of usersById as any[]) {
      userSubStatusByUserId.set(String(u._id), {
        subscriptionStatus: u.subscriptionStatus || null,
        subscriptionType: u.subscriptionType || null,
      });
    }

    const enriched = attempts.map((a: any) => {
      const ref = String(a.reference || "");
      const intent = ref ? latestIntentByRef.get(ref) : null;
      const intentStatus = intent?.status || null;
      const intentUserId = intent?.userId ? String(intent.userId) : null;
      const subscription = intentUserId ? latestSubByUserId.get(intentUserId) : null;
      const userState = intentUserId
        ? userSubStatusByUserId.get(intentUserId) || null
        : null;
      const processedWithoutError = !!a.processed && !a.ignored && !a.error;
      const reflected =
        processedWithoutError &&
        (isSuccessLikeStatus(intentStatus) ||
          String(subscription?.status || "").toLowerCase() === "active" ||
          String(userState?.subscriptionStatus || "").toLowerCase() === "active");

      return {
        ...a,
        diagnostics: {
          intentFound: !!intent,
          intentStatus,
          intentUserId,
          intentProvider: intent?.provider || null,
          planId: intent?.planId || null,
          subscriptionStatus: subscription?.status || null,
          userSubscriptionStatus: userState?.subscriptionStatus || null,
          reflected,
        },
      };
    });

    const total = await db
      .collection("whop_webhook_attempts")
      .countDocuments(filter);

    const stats = {
      total,
      processed: enriched.filter((a: any) => a.processed).length,
      failed: enriched.filter((a: any) => !!a.error).length,
      ignored: enriched.filter((a: any) => !!a.ignored).length,
      reflected: enriched.filter((a: any) => a.diagnostics?.reflected).length,
      missingIntent: enriched.filter((a: any) => !a.diagnostics?.intentFound).length,
    };

    /* ------------------------------------
       6️⃣ Response
    ------------------------------------ */
    return NextResponse.json(
      {
        data: enriched,
        stats,
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
