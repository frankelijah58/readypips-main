import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

/**
 * API endpoint to check and expire subscriptions
 * This should be called by a cron job or scheduled task
 * Run this endpoint daily to automatically expire subscriptions
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization check for cron job
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      // console.log("❌ [Check Expired] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    const currentDate = new Date();
    // console.log(`🔍 [Check Expired] Checking for expired subscriptions at ${currentDate.toISOString()}`);

    // Find all users with active subscriptions that have expired
    const expiredUsers = await usersCollection.find({
      subscriptionStatus: "active",
      subscriptionEndDate: { $lte: currentDate }
    }).toArray();

    // console.log(`🔍 [Check Expired] Found ${expiredUsers.length} expired subscriptions`);

    if (expiredUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired subscriptions found",
        count: 0
      });
    }

    // Process each expired user individually to check for pending subscriptions
    const updateResults = {
      activatedPending: 0,
      revertedToFree: 0,
      total: expiredUsers.length
    };

    for (const user of expiredUsers) {
      if (user.pendingSubscription) {
        // User has a pending subscription - activate it!
        const pending = user.pendingSubscription;
        const newStartDate = new Date();
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + pending.duration);

        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionStatus: "active",
              subscriptionType: pending.type,
              subscriptionStartDate: newStartDate,
              subscriptionEndDate: newEndDate,
              pendingSubscription: null, // Clear pending subscription
              updatedAt: currentDate
            }
          }
        );

        updateResults.activatedPending++;
        // console.log(`✅ [Check Expired] Activated pending ${pending.type} subscription for ${user.email}`);
      } else {
        // No pending subscription - revert to free plan
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionStatus: "active",
              subscriptionType: "free",
              subscriptionStartDate: currentDate,
              subscriptionEndDate: null,
              updatedAt: currentDate
            }
          }
        );

        updateResults.revertedToFree++;
        // console.log(`🔄 [Check Expired] Reverted ${user.email} to free plan`);
      }
    }

    // console.log(`✅ [Check Expired] Processed ${updateResults.total} expired subscriptions:`, {
      activatedPending: updateResults.activatedPending,
      revertedToFree: updateResults.revertedToFree
    });

    // Log details of expired subscriptions
    const expiredDetails = expiredUsers.map(user => ({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      plan: user.subscriptionType,
      expiredDate: user.subscriptionEndDate
    }));

    // console.log(`📊 [Check Expired] Expired subscriptions:`, expiredDetails);

    return NextResponse.json({
      success: true,
      message: `Processed ${updateResults.total} expired subscriptions`,
      count: updateResults.total,
      activatedPending: updateResults.activatedPending,
      revertedToFree: updateResults.revertedToFree,
      details: expiredDetails
    });

  } catch (error) {
    console.error("❌ [Check Expired] Error checking expired subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to check expired subscriptions" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to manually trigger expiration check (for testing)
 * In production, this should be restricted or removed
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    const currentDate = new Date();

    // Find users with expiring subscriptions (within next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringUsers = await usersCollection.find({
      subscriptionStatus: "active",
      subscriptionEndDate: { 
        $gte: currentDate,
        $lte: sevenDaysFromNow 
      }
    }).toArray();

    // Find already expired subscriptions
    const expiredUsers = await usersCollection.find({
      subscriptionStatus: "active",
      subscriptionEndDate: { $lte: currentDate }
    }).toArray();

    const expiringDetails = expiringUsers.map(user => {
      const daysRemaining = Math.ceil((new Date(user.subscriptionEndDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        plan: user.subscriptionType,
        endDate: user.subscriptionEndDate,
        daysRemaining
      };
    });

    const expiredDetails = expiredUsers.map(user => ({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      plan: user.subscriptionType,
      expiredDate: user.subscriptionEndDate
    }));

    return NextResponse.json({
      success: true,
      currentDate: currentDate.toISOString(),
      expiring: {
        count: expiringUsers.length,
        users: expiringDetails
      },
      expired: {
        count: expiredUsers.length,
        users: expiredDetails
      }
    });

  } catch (error) {
    console.error("❌ [Check Expired] Error:", error);
    return NextResponse.json(
      { error: "Failed to check subscriptions" },
      { status: 500 }
    );
  }
}
