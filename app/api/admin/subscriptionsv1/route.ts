import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyAdminToken, findAdminById, hasPermission, recordAdminAction, AdminPermission } from "@/lib/admin";
import {
  sendSubscriptionRenewedEmail,
  sendSubscriptionExpiringEmail,
} from "@/lib/email-notifications";
import { ObjectId } from "mongodb";

// Middleware to verify admin token
async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return { valid: false, error: "No token provided" };
  }

  const decoded = verifyAdminToken(token);
  if (!decoded) {
    return { valid: false, error: "Invalid token" };
  }

  const admin = await findAdminById(decoded.adminId);
  if (!admin || !admin.isActive) {
    return { valid: false, error: "Admin not found or inactive" };
  }

  return { valid: true, admin };
}

// GET all subscriptions
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    // if (!auth.valid) {
    //   return NextResponse.json({ error: auth.error }, { status: 401 });
    // }

    // const admin = auth.admin!;

    // // Check permission
    // if (!(await hasPermission(admin._id!, AdminPermission.VIEW_SUBSCRIPTIONS))) {
    //   return NextResponse.json(
    //     { error: "Insufficient permissions" },
    //     { status: 403 }
    //   );
    // }

    const db = await getDatabase();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // active, trial, expired, canceled
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    let filter: any = {};
    if (status) {
      filter.status = status;
    }

    const subscriptions = await db
      .collection("subscriptions")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const total = await db.collection("subscriptions").countDocuments(filter);

    return NextResponse.json(
      {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update subscription (extend, renew, cancel, etc.)
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (!(await hasPermission(admin._id!, AdminPermission.MANAGE_SUBSCRIPTIONS))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { subscriptionId, action, daysToAdd, reason } = await request.json();

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: "SubscriptionId and action are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const subscription = await db
      .collection("subscriptions")
      .findOne({ _id: new ObjectId(subscriptionId) });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let emailSent = false;

    switch (action) {
      case "extend":
        if (!daysToAdd) {
          return NextResponse.json(
            { error: "daysToAdd is required for extend action" },
            { status: 400 }
          );
        }
        const newExpiryDate = new Date(subscription.expiryDate);
        newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);
        updateData.expiryDate = newExpiryDate;
        updateData.lastExtendedBy = admin._id;
        updateData.lastExtendedAt = new Date();
        break;

      case "renew":
        const renewalDate = new Date();
        const renewalExpiryDate = new Date();
        renewalExpiryDate.setMonth(renewalExpiryDate.getMonth() + 1);

        updateData.status = "active";
        updateData.renewalDate = renewalDate;
        updateData.expiryDate = renewalExpiryDate;
        updateData.renewalCount = (subscription.renewalCount || 0) + 1;
        updateData.renewedBy = admin._id;

        // Send renewal email
        const user = await db.collection("users").findOne({ _id: subscription.userId });
        if (user) {
          await sendSubscriptionRenewedEmail(
            user.email,
            user.firstName || "User",
            subscription.planName || subscription.plan,
            renewalDate,
            renewalExpiryDate
          );
          emailSent = true;
        }
        break;

      case "cancel":
        updateData.status = "canceled";
        updateData.canceledAt = new Date();
        updateData.canceledBy = admin._id;
        updateData.cancellationReason = reason || "Admin cancellation";
        break;

      case "pause":
        updateData.status = "paused";
        updateData.pausedAt = new Date();
        updateData.pausedBy = admin._id;
        break;

      case "resume":
        updateData.status = "active";
        updateData.resumedAt = new Date();
        updateData.resumedBy = admin._id;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    updateData.updatedAt = new Date();

    const result = await db
      .collection("subscriptions")
      .updateOne({ _id: new ObjectId(subscriptionId) }, { $set: updateData });

    // Record action
    await recordAdminAction(admin._id!, "update_subscription", {
      subscriptionId: new ObjectId(subscriptionId),
      action,
      changes: updateData,
    });

    return NextResponse.json(
      {
        message: `Subscription ${action}ed successfully`,
        emailSent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
