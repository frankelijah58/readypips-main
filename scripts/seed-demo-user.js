#!/usr/bin/env node

/**
 * Demo User Seeder Script
 * Creates a demo user: 123@gmail.com / 123456789
 * Run with: node scripts/seed-demo-user.js
 */

require("dotenv").config();
const mongodb = require("mongodb");
const bcrypt = require("bcryptjs");

async function seedDemoUser() {
  let client;
  try {
    console.log("🌱 Starting demo user seeder...\n");

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set in environment variables");
    }

    client = new mongodb.MongoClient(mongoUri);
    await client.connect();

    const db = client.db("readypips");

    // Check if demo user already exists
    const existingUser = await db.collection("users").findOne({ email: "123@gmail.com" });

    if (existingUser) {
      console.log("✅ Demo user already exists!");
      console.log("   Email: 123@gmail.com");
      console.log("   Password: 123456789");
      console.log("   Skipping seed...\n");
      await client.close();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("123456789", 12);

    const demoUser = {
      email: "123@gmail.com",
      password: hashedPassword,
      firstName: "Demo",
      lastName: "User",
      phoneNumber: "0712345678",
      role: "user",
      isAdmin: false,
      subscriptionStatus: "active",
      subscriptionType: "pro",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      emailVerified: true,
      emailVerifiedAt: new Date(),
      provider: "credentials",
      referralCode: "DEMO123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(demoUser);

    console.log("✨ Demo User Created Successfully!\n");
    console.log("━".repeat(50));
    console.log("📊 DEMO USER CREDENTIALS");
    console.log("━".repeat(50));
    console.log("Email:    123@gmail.com");
    console.log("Password: 123456789");
    console.log("Role:     user");
    console.log("Status:   emailVerified = true (bypassed)");
    console.log("━".repeat(50));
    console.log("\n✅ Seeding completed successfully!");

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo user:", error.message);
    if (client) await client.close();
    process.exit(1);
  }
}

seedDemoUser();