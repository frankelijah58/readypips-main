#!/usr/bin/env node

/**
 * Database Verification Script
 * Check if admin account exists and database connection is working
 */

require("dotenv").config();
const mongodb = require("mongodb");

async function verifyDatabase() {
  let client;
  try {
    // console.log("🔍 Verifying database connection...\n");

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // console.log("📍 MongoDB URI:", mongoUri.substring(0, 50) + "...");

    client = new mongodb.MongoClient(mongoUri);
    await client.connect();
    // console.log("✅ Connected to MongoDB\n");

    const db = client.db(process.env.MONGODB_DB_NAME || "ready-pips");
    // console.log("📦 Database:", process.env.MONGODB_DB_NAME || "ready-pips", "\n");

    // Check collections
    // console.log("━".repeat(50));
    // console.log("📋 COLLECTIONS IN DATABASE:");
    // console.log("━".repeat(50));
    const collections = await db.listCollections().toArray();
    collections.forEach((col, i) => {
      // console.log(`${i + 1}. ${col.name}`);
    });

    // Check admins collection
    // console.log("\n" + "━".repeat(50));
    // console.log("👤 ADMINS COLLECTION:");
    // console.log("━".repeat(50));
    
    const adminsCount = await db.collection("admins").countDocuments();
    // console.log(`Total admins: ${adminsCount}\n`);

    if (adminsCount > 0) {
      // console.log("Admin records found:");
      const admins = await db.collection("admins").find({}).toArray();
      admins.forEach((admin, i) => {
        // console.log(`\n[${i + 1}] ${admin.email}`);
        // console.log(`    Role: ${admin.role}`);
        // console.log(`    Active: ${admin.isActive}`);
        // console.log(`    Created: ${admin.createdAt}`);
        // console.log(`    Has Password: ${!!admin.password}`);
      });
    } else {
      // console.log("❌ NO ADMINS FOUND IN DATABASE");
    }

    // Check specific admin
    // console.log("\n" + "━".repeat(50));
    // console.log("🔎 SEARCHING FOR admin@readypips.com:");
    // console.log("━".repeat(50));
    
    const admin = await db.collection("admins").findOne({ email: "admin@readypips.com" });
    if (admin) {
      // console.log("✅ Admin found!");
      // console.log(`Email: ${admin.email}`);
      // console.log(`Password Hash: ${admin.password.substring(0, 20)}...`);
      // console.log(`Role: ${admin.role}`);
      // console.log(`Active: ${admin.isActive}`);
    } else {
      // console.log("❌ Admin NOT found");
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

verifyDatabase();
