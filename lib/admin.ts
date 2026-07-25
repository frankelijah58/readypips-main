import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export enum AdminRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

export enum AdminPermission {
  // User Management
  VIEW_USERS = "view_users",
  CREATE_USER = "create_user",
  EDIT_USER = "edit_user",
  DELETE_USER = "delete_user",

  // Admin Management
  VIEW_ADMINS = "view_admins",
  CREATE_ADMIN = "create_admin",
  EDIT_ADMIN = "edit_admin",
  DELETE_ADMIN = "delete_admin",

  // Subscription Management
  VIEW_SUBSCRIPTIONS = "view_subscriptions",
  MANAGE_SUBSCRIPTIONS = "manage_subscriptions",
  MANAGE_PAYMENTS = "manage_payments",

  // Tools Management
  VIEW_TOOLS = "view_tools",
  MANAGE_TOOLS = "manage_tools",

  // Analytics
  VIEW_ANALYTICS = "view_analytics",

  // System Settings
  MANAGE_SETTINGS = "manage_settings",
  VIEW_LOGS = "view_logs",
  MANAGE_ROLES = "manage_roles",

  // Content & Communication
  VIEW_ANNOUNCEMENTS = "view_announcements",
  MANAGE_ANNOUNCEMENTS = "manage_announcements",
  SEND_CAMPAIGNS = "send_campaigns",
}

export interface AdminUser {
  _id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  isAdmin?: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface PasswordResetToken {
  _id?: string;
  email: string;
  token: string;
  type: "user" | "admin";
  expiresAt: Date;
  createdAt: Date;
}

// Role-based permissions mapping
export const rolePermissions: { [key in AdminRole]: AdminPermission[] } = {
  [AdminRole.SUPER_ADMIN]: Object.values(AdminPermission),
  [AdminRole.ADMIN]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.CREATE_USER,
    AdminPermission.EDIT_USER,
    AdminPermission.VIEW_ADMINS,
    AdminPermission.VIEW_SUBSCRIPTIONS,
    AdminPermission.MANAGE_SUBSCRIPTIONS,
    AdminPermission.VIEW_TOOLS,
    AdminPermission.VIEW_ANALYTICS,
    AdminPermission.VIEW_LOGS,
  ],
  [AdminRole.MODERATOR]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.EDIT_USER,
    AdminPermission.VIEW_SUBSCRIPTIONS,
    AdminPermission.VIEW_ANALYTICS,
  ],
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAdminToken(adminId: string): string {
  return jwt.sign({ adminId, type: "admin" }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAdminToken(token: string): { adminId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Accept both admin tokens (type: "admin") and regular tokens (userId)
    if (decoded.type === "admin") {
      return { adminId: decoded.adminId };
    } else if (decoded.userId) {
      // Regular token - return userId as adminId (will be verified as admin in findAdminById)
      return { adminId: decoded.userId };
    }
    return null;
  } catch {
    return null;
  }
}

export function generatePasswordResetToken(): string {
  return jwt.sign(
    { reset: true, timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function verifyPasswordResetToken(
  token: string
): { valid: boolean; timestamp?: number } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.reset) {
      return { valid: true, timestamp: decoded.timestamp };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function createAdmin(
  adminData: Omit<AdminUser, "_id" | "createdAt" | "updatedAt" | "permissions">
): Promise<AdminUser> {
  const db = await getDatabase();

  // Check if email already exists
  const existing = await db.collection("admins").findOne({ email: adminData.email });
  if (existing) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await hashPassword(adminData.password!);
  const permissions = rolePermissions[adminData.role];

  const admin = {
    ...adminData,
    password: hashedPassword,
    permissions,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("admins").insertOne(admin);
  return { ...admin, _id: result.insertedId.toString() };
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const db = await getDatabase();
  const admin = await db.collection("admins").findOne({ email });
  if (!admin) return null;

  return {
    _id: admin._id.toString(),
    email: admin.email,
    password: admin.password,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
    permissions: admin.permissions,
    isActive: admin.isActive,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    createdBy: admin.createdBy,
  };
}

export async function findAdminById(id: string): Promise<AdminUser | null> {
  const db = await getDatabase();
  try {
    const admin = await db
      .collection("admins")
      .findOne({ _id: new ObjectId(id) });
    if (!admin) return null;

    return {
      _id: admin._id.toString(),
      email: admin.email,
      password: admin.password,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      createdBy: admin.createdBy,
    };
  } catch (error) {
    return null;
  }
}

export async function getAllAdmins(): Promise<AdminUser[]> {
  const db = await getDatabase();
  const admins = await db
    .collection("admins")
    .find({})
    .project({ password: 0 })
    .toArray();

  return admins.map((admin) => ({
    _id: admin._id.toString(),
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
    permissions: admin.permissions,
    isActive: admin.isActive,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    createdBy: admin.createdBy,
  }));
}

export async function updateAdmin(
  adminId: string,
  updates: Partial<AdminUser>
): Promise<AdminUser | null> {
  const db = await getDatabase();
  const { password, ...safeUpdates } = updates;

  // If updating password, hash it
  let dataToUpdate: any = { ...safeUpdates, updatedAt: new Date() };
  if (password) {
    dataToUpdate.password = await hashPassword(password);
  }

  const result = await db
    .collection("admins")
    .findOneAndUpdate(
      { _id: new ObjectId(adminId) },
      { $set: dataToUpdate },
      { returnDocument: "after" }
    );

  if (!result || !result.value) return null;

  const admin = result.value;
  return {
    _id: admin._id.toString(),
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    role: admin.role,
    permissions: admin.permissions,
    isActive: admin.isActive,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    createdBy: admin.createdBy,
  };
}

export async function deleteAdmin(adminId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db
    .collection("admins")
    .deleteOne({ _id: new ObjectId(adminId) });
  return result.deletedCount > 0;
}

export async function updateAdminLastLogin(adminId: string): Promise<void> {
  const db = await getDatabase();
  await db
    .collection("admins")
    .updateOne(
      { _id: new ObjectId(adminId) },
      { $set: { lastLogin: new Date() } }
    );
}

export async function storePasswordResetToken(
  email: string,
  token: string,
  type: "user" | "admin"
): Promise<void> {
  const db = await getDatabase();
  await db.collection("password_reset_tokens").insertOne({
    email,
    token,
    type,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
    createdAt: new Date(),
  });
}

export async function findPasswordResetToken(
  email: string,
  token: string,
  type: "user" | "admin"
): Promise<PasswordResetToken | null> {
  const db = await getDatabase();
  const resetToken = await db.collection("password_reset_tokens").findOne({
    email,
    token,
    type,
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken) return null;

  return {
    _id: resetToken._id.toString(),
    email: resetToken.email,
    token: resetToken.token,
    type: resetToken.type,
    expiresAt: resetToken.expiresAt,
    createdAt: resetToken.createdAt,
  };
}

export async function deletePasswordResetToken(
  email: string,
  token: string
): Promise<void> {
  const db = await getDatabase();
  await db
    .collection("password_reset_tokens")
    .deleteOne({ email, token });
}

export async function hasPermission(
  adminId: string,
  permission: AdminPermission
): Promise<boolean> {
  const admin = await findAdminById(adminId);
  if (!admin || !admin.isActive) return false;
  return admin.permissions.includes(permission);
}

export async function recordAdminAction(
  adminId: string,
  action: string,
  details: any = {}
): Promise<void> {
  const db = await getDatabase();
  await db.collection("admin_audit_logs").insertOne({
    adminId,
    action,
    details,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    createdAt: new Date(),
  });
}
