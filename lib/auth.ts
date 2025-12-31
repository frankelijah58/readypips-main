import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "./mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export type UserRole = "user" | "affiliate" | "partner";

export interface AffiliateProfile {
  referralCode: string;
  commissionRate: number; // e.g. 0.1 = 10%
  totalEarnings: number;
  totalReferrals: number;
  isActive: boolean;
}

export interface PartnerProfile {
  companyName: string;
  tier: "silver" | "gold" | "platinum";
  revenueShare: number; // %
  managedAffiliates: number;
  totalRevenue: number;
  isApproved: boolean;
}


export interface User {
  _id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;

    /** 🔑 ROLE */
  role: UserRole;
  isAdmin?: boolean;

  /** 🧩 PROFILES (OPTIONAL) */
  affiliateProfile?: AffiliateProfile | null;
  partnerProfile?: PartnerProfile | null;

  subscriptionStatus: "active" | "inactive" | "expired";
  subscriptionType: "free" | "basic" | "premium" | "pro" | null;
  subscriptionEndDate?: Date;
  subscriptionStartDate?: Date;
  freeTrialEndDate?: Date; // 3-day free trial for new users
  // Pending subscription (scheduled to activate after current expires)
  pendingSubscription?: {
    type: "basic" | "premium" | "pro";
    planId: string;
    planName: string;
    duration: number; // days
    scheduledStartDate: Date; // When current subscription ends
  } | null;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  provider?: "credentials" | "google";
  googleId?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, email: string, role: string, isAdmin?: boolean ): string {
  return jwt.sign({ userId, email, role, isAdmin }, JWT_SECRET, { expiresIn: "7d" });
}

// Update return type to include email
export function verifyToken(
  token: string
): { userId: string; email: string; role: UserRole, isAdmin?: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function createUser(
  userData: Omit<User, "_id" | "createdAt" | "updatedAt">
): Promise<User> {
  const db = await getDatabase();
  const hashedPassword = await hashPassword(userData.password!);

  // Calculate 3-day free trial end date
  const freeTrialEndDate = new Date();
  freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 3);

  const user = {
    ...userData,
    password: hashedPassword,

    role: userData.role || "user",
    isAdmin: userData.isAdmin || false,

    affiliateProfile: null,
    partnerProfile: null,

    // Default to free plan for all new users with 3-day trial
    subscriptionStatus: "active" as "active" | "inactive" | "expired",
    subscriptionType: "free" as "free" | "basic" | "premium" | "pro" | null,
    subscriptionEndDate: undefined,
    freeTrialEndDate, // 3-day free trial
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("users").insertOne(user);
  return { ...user, _id: result.insertedId.toString() };
}

export async function findUser(email: string): Promise<User | null> {
  const db = await getDatabase();
  const user = await db.collection("users").findOne({ email });
  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,

    role: user.role || "user",
    isAdmin: user.isAdmin || false,

    affiliateProfile: user.affiliateProfile || null,
    partnerProfile: user.partnerProfile || null,

    subscriptionStatus: user.subscriptionStatus || "inactive",
    subscriptionType: user.subscriptionType || null,
    subscriptionEndDate: user.subscriptionEndDate,
    freeTrialEndDate: user.freeTrialEndDate,
    emailVerified: user.emailVerified || false,
    emailVerifiedAt: user.emailVerifiedAt,
    provider: user.provider || "credentials",
    googleId: user.googleId,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const { ObjectId } = require("mongodb");
  
  // Check admins collection first
  const admin = await db.collection("admins").findOne({ _id: new ObjectId(id) });
  if (admin) {
    return {
      _id: admin._id.toString(),
      email: admin.email,
      password: admin.password,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin.phoneNumber,
          
      role: admin.role || "admin",

      affiliateProfile: admin.affiliateProfile || null,
      partnerProfile: admin.partnerProfile || null,

      subscriptionStatus: "active" as any, // Admins always have active status
      subscriptionType: null,
      emailVerified: true,
      provider: admin.provider || "credentials",
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      isAdmin: true,
      
      permissions: admin.permissions,
    } as any;
  }
  
  // Check users collection
  const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,

    role: user.role || "user",
    isAdmin: user.isAdmin || false,

    affiliateProfile: user.affiliateProfile || null,
    partnerProfile: user.partnerProfile || null,

    subscriptionStatus: user.subscriptionStatus || "inactive",
    subscriptionType: user.subscriptionType || null,
    subscriptionEndDate: user.subscriptionEndDate,
    freeTrialEndDate: user.freeTrialEndDate,
    emailVerified: user.emailVerified || false,
    emailVerifiedAt: user.emailVerifiedAt,
    provider: user.provider || "credentials",
    googleId: user.googleId,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    subscriptionStatus: "active" | "inactive" | "expired";
    subscriptionType: "basic" | "premium" | "pro";
    subscriptionEndDate: Date;
    subscriptionStartDate?: Date;
  }
): Promise<void> {
  const db = await getDatabase();
  const { ObjectId } = require("mongodb");

  // When upgrading from free trial to paid, remove the freeTrialEndDate
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        ...subscriptionData,
        subscriptionStartDate: subscriptionData.subscriptionStartDate || new Date(),
        updatedAt: new Date(),
      },
      $unset: {
        freeTrialEndDate: "", // Remove free trial date when upgrading to paid
      },
    }
  );
}
