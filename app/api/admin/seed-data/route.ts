import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, findAdminById, hasPermission, AdminPermission } from "@/lib/admin";
import { getDatabase } from "@/lib/mongodb";

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

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const admin = auth.admin!;
    
    // Check if admin has permission to seed data (super_admin only)
    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can seed data" },
        { status: 403 }
      );
    }

    const db = await getDatabase();

    // Clear existing data
    await db.collection("users").deleteMany({});
    await db.collection("subscriptions").deleteMany({});
    await db.collection("tools").deleteMany({});
    await db.collection("announcements").deleteMany({});

    // Seed Users
    const users = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "hashed_password_1",
        isPremium: true,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
        country: "United States",
        phone: "+1234567890",
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "hashed_password_2",
        isPremium: true,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000),
        country: "United Kingdom",
        phone: "+4455667788",
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob@example.com",
        password: "hashed_password_3",
        isPremium: false,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
        country: "Canada",
        phone: "+14165551234",
      },
      {
        firstName: "Alice",
        lastName: "Williams",
        email: "alice@example.com",
        password: "hashed_password_4",
        isPremium: true,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000),
        country: "Australia",
        phone: "+61234567890",
      },
      {
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie@example.com",
        password: "hashed_password_5",
        isPremium: false,
        isEmailVerified: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        country: "South Africa",
        phone: "+27123456789",
      },
      {
        firstName: "Diana",
        lastName: "Prince",
        email: "diana@example.com",
        password: "hashed_password_6",
        isPremium: true,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000),
        country: "Germany",
        phone: "+49301234567",
      },
      {
        firstName: "Edward",
        lastName: "Norton",
        email: "edward@example.com",
        password: "hashed_password_7",
        isPremium: false,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 8 * 60 * 60 * 1000),
        country: "Singapore",
        phone: "+6581234567",
      },
      {
        firstName: "Fiona",
        lastName: "Green",
        email: "fiona@example.com",
        password: "hashed_password_8",
        isPremium: true,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        lastLogin: new Date(Date.now() - 36 * 60 * 60 * 1000),
        country: "Ireland",
        phone: "+35312345678",
      },
    ];

    const usersResult = await db.collection("users").insertMany(users);
    const userIds = Object.values(usersResult.insertedIds);

    // Seed Subscriptions
    const subscriptions = [
      {
        userId: userIds[0],
        plan: "Premium",
        price: 29.99,
        status: "active",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: userIds[1],
        plan: "Pro",
        price: 49.99,
        status: "active",
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        userId: userIds[2],
        plan: "Basic",
        price: 9.99,
        status: "active",
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        userId: userIds[3],
        plan: "Premium",
        price: 29.99,
        status: "active",
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: userIds[4],
        plan: "Basic",
        price: 9.99,
        status: "expired",
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        userId: userIds[5],
        plan: "Pro",
        price: 49.99,
        status: "active",
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        userId: userIds[6],
        plan: "Basic",
        price: 9.99,
        status: "trial",
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: userIds[7],
        plan: "Premium",
        price: 29.99,
        status: "active",
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.collection("subscriptions").insertMany(subscriptions);

    // Seed Tools
    const tools = [
      {
        name: "Market Alerts",
        description: "Real-time market alerts and notifications",
        category: "signals",
        isActive: true,
        accessLevel: "premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Harmonic Analysis",
        description: "Advanced harmonic pattern analysis tool",
        category: "analysis",
        isActive: true,
        accessLevel: "pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "AI Insights",
        description: "AI-powered market insights and predictions",
        category: "ai",
        isActive: true,
        accessLevel: "pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Trading Signals",
        description: "Professional trading signals with high accuracy",
        category: "signals",
        isActive: true,
        accessLevel: "premium",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Copy Trading",
        description: "Copy trades from professional traders",
        category: "trading",
        isActive: true,
        accessLevel: "pro",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("tools").insertMany(tools);

    // Seed Announcements
    const announcements = [
      {
        title: "Platform Maintenance",
        content: "Scheduled platform maintenance on Sunday 2-4 AM UTC",
        type: "maintenance",
        priority: "high",
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "New Feature Release",
        content: "We have launched advanced technical analysis tools",
        type: "feature",
        priority: "medium",
        isActive: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Market Update",
        content: "Today market volatility is above normal levels",
        type: "alert",
        priority: "high",
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        title: "Q4 Promotion",
        content: "Get 50% off on Pro plan - Limited time offer",
        type: "promotion",
        priority: "medium",
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.collection("announcements").insertMany(announcements);

    return NextResponse.json(
      {
        message: "Demo data seeded successfully",
        summary: {
          users: users.length,
          subscriptions: subscriptions.length,
          tools: tools.length,
          announcements: announcements.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
