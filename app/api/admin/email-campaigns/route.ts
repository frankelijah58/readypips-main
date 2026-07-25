import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyAdminToken, findAdminById, hasPermission, recordAdminAction, AdminPermission } from "@/lib/admin";
import { sendAnnouncementEmail } from "@/lib/email-notifications";
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

// GET all email campaigns
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    const db = await getDatabase();
    const campaigns = await db
      .collection("email_campaigns")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create and send email campaign
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (!(await hasPermission(admin._id!, AdminPermission.MANAGE_SETTINGS))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { subject, content, targetAudience, sendNow } = await request.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Determine recipients based on audience
    let filter: any = {};
    switch (targetAudience) {
      case "premium":
        filter = { "subscription.status": "active", "subscription.type": { $in: ["silver", "gold"] } };
        break;
      case "trial":
        filter = { "subscription.status": "trial" };
        break;
      case "inactive":
        filter = { "subscription.status": { $in: ["expired", "inactive"] } };
        break;
      default:
        filter = {}; // all users
    }

    const users = await db.collection("users").find(filter).toArray();

    let sentCount = 0;
    let failedCount = 0;

    if (sendNow) {
      // Send emails immediately
      for (const user of users) {
        try {
          const success = await sendAnnouncementEmail(
            user.email,
            user.firstName || "User",
            subject,
            content
          );
          if (success) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`Failed to send email to ${user.email}:`, err);
          failedCount++;
        }
      }
    }

    const campaign = {
      _id: new ObjectId(),
      subject,
      content,
      targetAudience: targetAudience || "all",
      totalRecipients: users.length,
      sentCount: sendNow ? sentCount : 0,
      failedCount: sendNow ? failedCount : 0,
      status: sendNow ? "sent" : "draft",
      createdBy: admin._id,
      createdAt: new Date(),
      sentAt: sendNow ? new Date() : null,
    };

    const result = await db.collection("email_campaigns").insertOne(campaign);

    // Record action
    await recordAdminAction(admin._id!, "create_email_campaign", {
      campaignId: result.insertedId,
      subject,
      recipientCount: users.length,
      status: campaign.status,
    });

    return NextResponse.json(
      {
        message: sendNow ? `Email campaign sent to ${sentCount} recipients` : "Email campaign created",
        campaign,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
