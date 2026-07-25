const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const client = new MongoClient(uri);

async function setup() {
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "READYPIPS");

    console.log("🚀 Connected to MongoDB");
    console.log("📦 Creating collections...");

    const collections = [
      "users",
      "admins",
      "subscriptions",
      "payment_intents",
      "payments",
      "signals",
      "analyses",
      "tools",
      "plan_tool_mappings",
      "announcements",
      "email_campaigns",
      "withdrawals",
      "passwordResets",
      "whop_webhook_attempts",
      "referrals",
    ];

    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map((c) => c.name);

    for (const name of collections) {
      if (!existingNames.includes(name)) {
        await db.createCollection(name);
        console.log(`✅ Created collection: ${name}`);
      } else {
        console.log(`ℹ️ Collection already exists: ${name}`);
      }
    }

    console.log("🔐 Creating indexes...");

    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("admins").createIndex({ email: 1 }, { unique: true });
    await db.collection("passwordResets").createIndex({ token: 1 }, { unique: true });
    await db.collection("payment_intents").createIndex({ reference: 1 });
    await db.collection("payments").createIndex({ reference: 1 });
    await db.collection("subscriptions").createIndex({ userId: 1 });
    await db.collection("withdrawals").createIndex({ userId: 1 });
    await db.collection("referrals").createIndex({ partnerId: 1 });

    console.log("✅ Database setup completed successfully");
  } catch (error) {
    console.error("❌ Setup failed:", error);
  } finally {
    await client.close();
    process.exit();
  }
}

setup();