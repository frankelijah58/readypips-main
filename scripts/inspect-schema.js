#!/usr/bin/env node

/**
 * Database Schema Inspection Script
 * Shows what collections and data exist in the database
 */

require("dotenv").config();
const mongodb = require("mongodb");

async function inspectDatabase() {
  let client;
  try {
    // console.log("🔍 Inspecting database schema...\n");

    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || "ready-pips";

    client = new mongodb.MongoClient(mongoUri);
    await client.connect();

    const db = client.db(dbName);

    // Get all collections
    const collections = await db.listCollections().toArray();
    
    // console.log("━".repeat(60));
    // console.log("DATABASE COLLECTIONS AND SAMPLE DATA");
    // console.log("━".repeat(60));

    for (const col of collections) {
      const collName = col.name;
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      
      // console.log(`\n📦 ${collName.toUpperCase()}`);
      // console.log(`   Total documents: ${count}`);
      
      if (count > 0) {
        const sample = await collection.findOne({});
        if (sample) {
          // console.log(`   Sample fields: ${Object.keys(sample).join(", ")}`);
        }
      }
    }

    // console.log("\n" + "━".repeat(60));
    // console.log("DETAILED COLLECTION INFO");
    // console.log("━".repeat(60));

    // Get detailed info for important collections
    const importantCollections = ["users", "subscriptions", "tools", "announcements", "email_campaigns"];
    
    for (const collName of importantCollections) {
      const collection = db.collection(collName);
      const exists = (await db.listCollections({ name: collName }).toArray()).length > 0;
      
      if (exists) {
        const count = await collection.countDocuments();
        // console.log(`\n${collName}:`);
        // console.log(`  - Count: ${count}`);
        if (count > 0) {
          const sample = await collection.findOne({});
          // console.log(`  - Sample: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
        }
      }
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

inspectDatabase();
