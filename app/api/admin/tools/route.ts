import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyAdminToken, findAdminById, hasPermission, recordAdminAction, AdminPermission } from "@/lib/admin";
import { sendNewToolAnnouncementEmail } from "@/lib/email-notifications";
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

// GET all tools
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (!(await hasPermission(admin._id!, AdminPermission.VIEW_TOOLS))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const db = await getDatabase();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category"); // market-structure, smart-money, indicators, etc.
    const plan = searchParams.get("plan"); // silver, gold, premium

    let filter: any = {};
    if (category) {
      filter.category = category;
    }

    const tools = await db
      .collection("tools")
      .find(filter)
      .sort({ popularity: -1 })
      .toArray();

    // Get plan mappings
    let planMappings: any = {};
    if (plan) {
      const mapping = await db
        .collection("plan_tool_mappings")
        .findOne({ plan });
      planMappings = mapping || {};
    } else {
      const allMappings = await db
        .collection("plan_tool_mappings")
        .find({})
        .toArray();
      allMappings.forEach((m: any) => {
        planMappings[m.plan] = m.toolIds || [];
      });
    }

    return NextResponse.json(
      {
        tools,
        planMappings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new tool
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (!(await hasPermission(admin._id!, AdminPermission.MANAGE_TOOLS))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const {
      name,
      description,
      category,
      version,
      plansToAdd,
      notifyUsers,
      notificationMessage,
    } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const tool = {
      _id: new ObjectId(),
      name,
      description: description || "",
      category, // market-structure, smart-money, indicators, oscillators, etc.
      version: version || "1.0",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: admin._id,
      userCount: 0,
      popularity: 0,
      ratings: 0,
      reviews: 0,
      enabled: true,
    };

    const toolResult = await db.collection("tools").insertOne(tool);

    // Add to plans if specified
    if (plansToAdd && Array.isArray(plansToAdd) && plansToAdd.length > 0) {
      for (const planName of plansToAdd) {
        const updateDoc: any = {
          $push: { toolIds: toolResult.insertedId }
        };
        await db.collection("plan_tool_mappings").updateOne(
          { plan: planName },
          updateDoc,
          { upsert: true }
        );
      }
    }

    // Notify users if requested
    if (notifyUsers && plansToAdd && plansToAdd.length > 0) {
      const users = await db
        .collection("users")
        .find({
          "subscription.status": "active",
          "subscription.type": { $in: plansToAdd },
        })
        .toArray();

      let notifiedCount = 0;
      for (const user of users) {
        try {
          const success = await sendNewToolAnnouncementEmail(
            user.email,
            user.firstName || "User",
            name,
            notificationMessage || description,
            user.subscription?.type || "Unknown Plan"
          );
          if (success) notifiedCount++;
        } catch (err) {
          console.error(`Failed to notify user ${user.email}:`, err);
        }
      }

      // Record notification action
      await recordAdminAction(admin._id!, "notify_tool_available", {
        toolId: toolResult.insertedId,
        toolName: name,
        notifiedUsers: notifiedCount,
      });
    }

    // Record action
    await recordAdminAction(admin._id!, "create_tool", {
      toolId: toolResult.insertedId,
      toolName: name,
      category,
      plans: plansToAdd || [],
    });

    return NextResponse.json(
      {
        message: "Tool created successfully",
        tool,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tool:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update tool
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (!(await hasPermission(admin._id!, AdminPermission.MANAGE_TOOLS))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { toolId, updates } = await request.json();

    if (!toolId || !updates) {
      return NextResponse.json(
        { error: "ToolId and updates are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const tool = await db
      .collection("tools")
      .findOne({ _id: new ObjectId(toolId) });

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    updates.updatedAt = new Date();
    updates.updatedBy = admin._id;

    await db
      .collection("tools")
      .updateOne(
        { _id: new ObjectId(toolId) },
        { $set: updates }
      );

    // Record action
    await recordAdminAction(admin._id!, "update_tool", {
      toolId: new ObjectId(toolId),
      toolName: tool.name,
      changes: updates,
    });

    return NextResponse.json(
      { message: "Tool updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating tool:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE tool
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (!(await hasPermission(admin._id!, AdminPermission.MANAGE_TOOLS))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { toolId } = await request.json();

    if (!toolId) {
      return NextResponse.json(
        { error: "ToolId is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const tool = await db
      .collection("tools")
      .findOne({ _id: new ObjectId(toolId) });

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    // Soft delete
    await db.collection("tools").updateOne(
      { _id: new ObjectId(toolId) },
      {
        $set: {
          enabled: false,
          disabledAt: new Date(),
          disabledBy: admin._id,
        },
      }
    );

    // Record action
    await recordAdminAction(admin._id!, "delete_tool", {
      toolId: new ObjectId(toolId),
      toolName: tool.name,
    });

    return NextResponse.json(
      { message: "Tool deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting tool:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
