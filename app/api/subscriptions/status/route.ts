import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * API endpoint to get user's current subscription status and countdown
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);

    // Get user subscription data
    const user = await db.collection("users").findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentDate = new Date();
    const subscriptionEndDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
    const freeTrialEndDate = user.freeTrialEndDate ? new Date(user.freeTrialEndDate) : null;
    
    let daysRemaining = 0;
    let hoursRemaining = 0;
    let isExpiringSoon = false;
    let isExpired = false;
    let freeTrialDaysRemaining = 0;
    let isFreeTrialExpired = false;

    // Check if user is on free plan
    const isFreePlan = !user.subscriptionType || user.subscriptionType === "free";

    // Handle free trial
    if (isFreePlan && freeTrialEndDate) {
      const trialTimeDiff = freeTrialEndDate.getTime() - currentDate.getTime();
      freeTrialDaysRemaining = Math.ceil(trialTimeDiff / (1000 * 60 * 60 * 24));
      isFreeTrialExpired = freeTrialDaysRemaining <= 0;

      // If free trial expired, mark as expired in the database
      if (isFreeTrialExpired && user.subscriptionStatus === "active") {
        await db.collection("users").updateOne(
          { _id: userId },
          {
            $set: {
              subscriptionStatus: "expired",
              updatedAt: new Date()
            }
          }
        );
        user.subscriptionStatus = "expired";
      }
    }

    // Handle paid subscriptions
    if (subscriptionEndDate && !isFreePlan) {
      const timeDiff = subscriptionEndDate.getTime() - currentDate.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      hoursRemaining = Math.ceil(timeDiff / (1000 * 60 * 60));
      
      isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
      isExpired = daysRemaining <= 0;

      // Auto-expire if subscription is past end date - revert to expired status
      if (isExpired && user.subscriptionStatus === "active") {
        await db.collection("users").updateOne(
          { _id: userId },
          {
            $set: {
              subscriptionStatus: "expired",
              updatedAt: new Date()
            }
          }
        );
        user.subscriptionStatus = "expired";
      }
    }

    // If no subscription type set, default to free plan with 3-day trial
    if (!user.subscriptionType) {
      const newTrialEndDate = new Date();
      newTrialEndDate.setDate(newTrialEndDate.getDate() + 3);
      
      await db.collection("users").updateOne(
        { _id: userId },
        {
          $set: {
            subscriptionStatus: "active",
            subscriptionType: "free",
            subscriptionEndDate: null,
            freeTrialEndDate: newTrialEndDate,
            updatedAt: new Date()
          }
        }
      );
      user.subscriptionStatus = "active";
      user.subscriptionType = "free";
      user.freeTrialEndDate = newTrialEndDate;
      freeTrialDaysRemaining = 3;
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: user.subscriptionStatus || "active",
        type: user.subscriptionType || "free",
        startDate: user.subscriptionStartDate || null,
        endDate: subscriptionEndDate?.toISOString() || null,
        freeTrialEndDate: freeTrialEndDate?.toISOString() || null,
        daysRemaining: isFreePlan ? freeTrialDaysRemaining : daysRemaining,
        hoursRemaining: isFreePlan ? (freeTrialDaysRemaining * 24) : hoursRemaining,
        isExpiringSoon: isFreePlan ? (freeTrialDaysRemaining <= 1 && freeTrialDaysRemaining > 0) : isExpiringSoon,
        isExpired: isFreePlan ? isFreeTrialExpired : isExpired,
        isActive: user.subscriptionStatus === "active" && (isFreePlan ? !isFreeTrialExpired : !isExpired),
        isFreePlan,
        isFreeTrialExpired,
        freeTrialDaysRemaining,
        pendingSubscription: user.pendingSubscription || null
      },
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error("❌ [Subscription Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
