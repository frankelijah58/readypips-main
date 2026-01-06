#!/usr/bin/env node

/**
 * Seed Demo Data Script
 * Creates sample users, subscriptions, tools, and announcements for testing
 */

require("dotenv").config();
const mongodb = require("mongodb");
const crypto = require("crypto");

async function seedData() {
  let client;
  try {
    // console.log("Seeding demo data...\n");

    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || "ready-pips";

    client = new mongodb.MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);

    // Clear existing data
    // console.log("Clearing existing collections...");
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
    // console.log(`Created ${usersResult.insertedIds.length} users`);

    const userIds = Object.values(usersResult.insertedIds);

    // Seed Subscriptions
    const plans = ["Basic", "Premium", "Pro"];
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

    const subsResult = await db.collection("subscriptions").insertMany(subscriptions);
    // console.log(`Created ${subsResult.insertedIds.length} subscriptions`);

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

    const toolsResult = await db.collection("tools").insertMany(tools);
    // console.log(`Created ${toolsResult.insertedIds.length} tools`);

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
        content: "We've launched advanced technical analysis tools",
        type: "feature",
        priority: "medium",
        isActive: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Market Update",
        content: "Today's market volatility is above normal levels",
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

    const announcementsResult = await db.collection("announcements").insertMany(announcements);
    // console.log(`Created ${announcementsResult.insertedIds.length} announcements`);

    // console.log("\n" + "=".repeat(50));
    // console.log("DEMO DATA SEEDED SUCCESSFULLY");
    // console.log("=".repeat(50));
    // console.log("\nSummary:");
    // console.log(`- ${users.length} Users`);
    // console.log(`- ${subscriptions.length} Subscriptions`);
    // console.log(`- ${tools.length} Tools`);
    // console.log(`- ${announcements.length} Announcements`);

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error.message);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

seedData();
