#!/usr/bin/env node

/**
 * Admin Seeder Script
 * This script creates a default super admin user in the database
 * Run with: node scripts/seed-admin.js
 */

// Use require for direct database access
require("dotenv").config();
const mongodb = require("mongodb");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

async function seedAdmin() {
  let client;
  try {
    // console.log("🌱 Starting admin seeder...\n");

    // Connect to MongoDB using environment variable
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set in environment variables");
    }

    client = new mongodb.MongoClient(mongoUri);
    await client.connect();

    const db = client.db("readypips");

    // Check if super admin already exists
    const existingAdmin = await db
      .collection("admins")
      .findOne({ role: "super_admin" });

    if (existingAdmin) {
      // console.log("✅ Super admin already exists!");
      // console.log(`   Email: ${existingAdmin.email}`);
      // console.log("   Skipping seed...\n");
      await client.close();
      process.exit(0);
    }

    // Set fixed password for easy access during development
    const tempPassword = "1234567890";
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Define super admin permissions
    const allPermissions = [
      "view_users",
      "create_user",
      "edit_user",
      "delete_user",
      "view_admins",
      "create_admin",
      "edit_admin",
      "delete_admin",
      "view_subscriptions",
      "manage_subscriptions",
      "manage_payments",
      "view_tools",
      "manage_tools",
      "view_analytics",
      "manage_settings",
      "view_logs",
      "manage_roles",
    ];

    const superAdmin = {
      email: "admin@readypips.com",
      password: hashedPassword,
      firstName: "Ready",
      lastName: "Pips",
      role: "super_admin",
      permissions: allPermissions,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("admins").insertOne(superAdmin);

    // console.log("✨ Super Admin Created Successfully!\n");
    // console.log("━".repeat(50));
    // console.log("📊 ADMIN CREDENTIALS");
    // console.log("━".repeat(50));
    // console.log(`Email:    ${superAdmin.email}`);
    // console.log(`Password: ${tempPassword}`);
    // console.log(`Role:     ${superAdmin.role}`);
    // console.log("━".repeat(50));
    // console.log("\n⚠️  IMPORTANT:");
    // console.log("1. Save these credentials in a secure location");
    // console.log("2. Login to the admin dashboard at: /admin/login");
    // console.log("3. Change the password after first login");
    // console.log("4. Use admin dashboard to create additional admin accounts\n");

    // console.log("✅ Seeding completed successfully!");
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    if (client) await client.close();
    process.exit(1);
  }
}

seedAdmin();
