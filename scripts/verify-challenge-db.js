// Quick script to verify MongoDB connection and list collections
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://codepappi:KUPj3QyIJ09FRV3u@cluster0.5ajpmas.mongodb.net/?appName=Cluster0";

async function main() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("✅ Connected successfully!\n");

    const db = client.db("READYPIPS");

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("=== Collections in READYPIPS database ===");
    collections.forEach((c) => {
      console.log(`  - ${c.name}`);
    });

    // Check challenge_participants collection
    const participantCount = await db.collection("challenge_participants").countDocuments();
    console.log(`\n=== challenge_participants: ${participantCount} documents ===`);

    // Check challenge payments
    const challengePayments = await db.collection("payment_intents").countDocuments({
      type: "challenge_payment",
    });
    console.log(`=== payment_intents (challenge_payment): ${challengePayments} documents ===`);

    const paidChallengePayments = await db.collection("payment_intents").countDocuments({
      type: "challenge_payment",
      status: "paid",
    });
    console.log(`=== payment_intents (challenge_payment + paid): ${paidChallengePayments} documents ===`);

    // Show a few sample participants
    if (participantCount > 0) {
      const samples = await db.collection("challenge_participants").find({}).limit(3).toArray();
      console.log("\n=== Sample participants ===");
      samples.forEach((p) => {
        console.log(`  - ${p.displayName || p.email}: MT5=${p.mt5_login}, server=${p.server}, profit=${p.profit}, status=${p.status}`);
      });
    }

    console.log("\n✅ Database verification complete!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

main();