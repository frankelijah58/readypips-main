import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyAdminToken, findAdminById, hasPermission, recordAdminAction, AdminPermission } from "@/lib/admin";
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

// GET all announcements
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    const db = await getDatabase();
    const announcements = await db
      .collection("announcements")
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new announcement
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

    const { title, content, type, targetAudience, scheduledFor } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const announcement = {
      _id: new ObjectId(),
      title,
      content,
      type: type || "general", // general, promotion, maintenance, urgent
      targetAudience: targetAudience || "all", // all, free, premium, specific
      status: "draft", // draft, scheduled, published, archived
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdBy: admin._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
    };

    const result = await db.collection("announcements").insertOne(announcement);

    // Record action
    await recordAdminAction(admin._id!, "create_announcement", {
      announcementId: result.insertedId,
      title,
      type,
    });

    return NextResponse.json(
      {
        message: "Announcement created successfully",
        announcement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
