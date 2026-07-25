import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminToken,
  findAdminById,
  hasPermission,
  AdminPermission,
  updateAdmin,
  deleteAdmin,
  recordAdminAction,
} from "@/lib/admin";

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

// GET single admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (
      !(await hasPermission(admin._id!, AdminPermission.VIEW_ADMINS))
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const targetAdmin = await findAdminById(id);
    if (!targetAdmin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    const { password: _, ...safeAdmin } = targetAdmin;

    return NextResponse.json({ admin: safeAdmin }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update admin
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (
      !(await hasPermission(admin._id!, AdminPermission.EDIT_ADMIN))
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Can't edit self role
    if (id === admin._id && request.json) {
      const body = await request.json();
      if (body.role && body.role !== admin.role) {
        return NextResponse.json(
          { error: "Cannot change your own role" },
          { status: 400 }
        );
      }
    }

    const updates = await request.json();

    // Prevent non-super-admins from changing roles or creating/deleting super admins
    if (
      admin.role !== "super_admin" &&
      (updates.role || updates.permissions)
    ) {
      return NextResponse.json(
        { error: "Only super admins can change roles and permissions" },
        { status: 403 }
      );
    }

    const updatedAdmin = await updateAdmin(id, updates);
    if (!updatedAdmin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Record action
    await recordAdminAction(admin._id!, "update_admin", {
      targetAdminId: id,
      updates,
    });

    const { password: _, ...safeAdmin } = updatedAdmin;

    return NextResponse.json(
      {
        message: "Admin updated successfully",
        admin: safeAdmin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (
      !(await hasPermission(admin._id!, AdminPermission.DELETE_ADMIN))
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Can't delete self
    if (id === admin._id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const targetAdmin = await findAdminById(id);
    if (!targetAdmin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Only super admin can delete super admins
    if (
      targetAdmin.role === "super_admin" &&
      admin.role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Only super admins can delete super admins" },
        { status: 403 }
      );
    }

    await deleteAdmin(id);

    // Record action
    await recordAdminAction(admin._id!, "delete_admin", {
      deletedAdminId: id,
      deletedAdminEmail: targetAdmin.email,
    });

    return NextResponse.json(
      {
        message: "Admin deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
