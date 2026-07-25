import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const verifyResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userData = await verifyResponse.json();
    const db = await getDatabase();

    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(userData.user._id) },
        {
          projection: {
            credits: 1,
            subscriptionType: 1,
            subscriptionStatus: 1,
          },
        }
      );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      credits: user.credits || 0,
      subscriptionType: user.subscriptionType || "free",
      subscriptionStatus: user.subscriptionStatus || "inactive",
    });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const verifyResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userData = await verifyResponse.json();
    const { action, amount } = await request.json();

    const db = await getDatabase();

    if (action === "deduct") {
      const result = await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userData.user._id) },
          { $inc: { credits: -amount } }
        );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: "Failed to deduct credits" },
          { status: 400 }
        );
      }
    } else if (action === "add") {
      const result = await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userData.user._id) },
          { $inc: { credits: amount } }
        );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: "Failed to add credits" },
          { status: 400 }
        );
      }
    }

    // Get updated user data
    const updatedUser = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(userData.user._id) },
        {
          projection: {
            credits: 1,
            subscriptionType: 1,
            subscriptionStatus: 1,
          },
        }
      );

    return NextResponse.json({
      credits: updatedUser?.credits || 0,
      subscriptionType: updatedUser?.subscriptionType || "free",
      subscriptionStatus: updatedUser?.subscriptionStatus || "inactive",
    });
  } catch (error) {
    console.error("Error updating credits:", error);
    return NextResponse.json(
      { error: "Failed to update credits" },
      { status: 500 }
    );
  }
}
