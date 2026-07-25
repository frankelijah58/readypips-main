import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminToken,
  findAdminById,
  hasPermission,
  AdminPermission,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  recordAdminAction,
} from "@/lib/admin";
import { sendAdminWelcomeEmail } from "@/lib/email-notifications";

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

// GET all admins
export async function GET(request: NextRequest) {
  try {
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

    const admins = await getAllAdmins();

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new admin
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;

    // Check permission
    if (
      !(await hasPermission(admin._id!, AdminPermission.CREATE_ADMIN))
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { email, firstName, lastName, role, password } = await request.json();

    if (!email || !firstName || !lastName || !role || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["super_admin", "admin", "moderator"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Only super admin can create super admins
    if (role === "super_admin" && admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can create super admins" },
        { status: 403 }
      );
    }

    const newAdmin = await createAdmin({
      email,
      firstName,
      lastName,
      role,
      password,
      isActive: true,
      createdBy: admin._id!,
    });

    // Send welcome email with credentials
    await sendAdminWelcomeEmail(
      newAdmin.email,
      newAdmin.firstName,
      password, // Send the original password before hashing
      role
    );

    // Record action
    await recordAdminAction(admin._id!, "create_admin", {
      newAdminId: newAdmin._id,
      newAdminEmail: newAdmin.email,
      role: role,
    });

    const { password: _, ...safeAdmin } = newAdmin;

    return NextResponse.json(
      {
        message: "Admin created successfully. Welcome email sent.",
        admin: safeAdmin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating admin:", error);
    if (error.message === "Email already exists") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
