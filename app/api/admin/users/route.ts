import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyAdminToken, findAdminById, hasPermission, recordAdminAction, AdminPermission } from "@/lib/admin";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

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

// GET all users
export async function GET(request: NextRequest) {
  try {
    // const auth = await verifyAdmin(request);
    // if (!auth.valid) {
    //   return NextResponse.json({ error: auth.error }, { status: 401 });
    // }

    // const admin = auth.admin!;

    // Check permission
    // if (!(await hasPermission(admin._id!, AdminPermission.VIEW_USERS))) {
    //   return NextResponse.json(
    //     { error: "Insufficient permissions" },
    //     { status: 403 }
    //   );
    // }

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);

    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search"); // search by email or name
    const subscriptionStatus = searchParams.get("subscription"); // active, expired, trial, none
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    let filter: any = {};

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    if (subscriptionStatus) {
      filter["subscription.status"] = subscriptionStatus;
    }

    const users = await db
      .collection("users")
      .find(filter)
      .project({ password: 0 }) // Exclude password
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const total = await db.collection("users").countDocuments(filter);

    return NextResponse.json(
      {
        users,
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
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(request: NextRequest) {
  try {
    // const auth = await verifyAdmin(request);
    // if (!auth.valid) {
    //   return NextResponse.json({ error: auth.error }, { status: 401 });
    // }

    // const admin = auth.admin!;

    // // Check permission
    // if (!(await hasPermission(admin._id!, AdminPermission.EDIT_USER))) {
    //   return NextResponse.json(
    //     { error: "Insufficient permissions" },
    //     { status: 403 }
    //   );
    // }

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);

    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "UserId and updates are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Prevent updating email directly (security)
    if (updates.email) {
      return NextResponse.json(
        { error: "Email cannot be updated directly" },
        { status: 400 }
      );
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    updates.updatedAt = new Date();
    updates.updatedBy = decoded.userId;

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: updates }
      );

    // Record action
    await recordAdminAction(decoded.userId!, "edit_user", {
      userId: new ObjectId(userId),
      userEmail: user.email,
      changes: updates,
    });

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (!(await hasPermission(admin._id!, AdminPermission.DELETE_USER))) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "UserId is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            isActive: false,
            deletedAt: new Date(),
            deletedBy: admin._id,
            deletionReason: reason || "Admin deletion",
          },
        }
      );

    // Record action
    await recordAdminAction(admin._id!, "delete_user", {
      userId: new ObjectId(userId),
      userEmail: user.email,
      reason: reason || "No reason provided",
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
