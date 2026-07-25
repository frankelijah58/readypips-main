import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { SignalService } from "@/lib/signal-service";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // console.log("🚀 Dashboard API called");

    // Check environment variables
    // console.log("🔧 Environment check:");
    // console.log(
    //   "- MONGODB_URI:",
    //   process.env.MONGODB_URI ? "✅ Set" : "❌ Missing"
    // );
    // console.log(
    //   "- JWT_SECRET:",
    //   process.env.JWT_SECRET ? "✅ Set" : "❌ Missing"
    // );
    // console.log(
    //   "- STRIPE_SECRET_KEY:",
    //   process.env.STRIPE_SECRET_KEY ? "✅ Set" : "❌ Missing"
    // );

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // console.log("❌ No authorization header or invalid format");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    // console.log("🔑 Token received:", token.substring(0, 10) + "...");

    const tokenData = verifyToken(token);
    if (!tokenData) {
      // console.log("❌ Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // console.log("✅ Token verified, userId:", tokenData.userId);

    // console.log("🗄️ Connecting to database...");
    const db = await getDatabase();
    // console.log("✅ Database connected");

    const signalsCollection = db.collection("signals");
    const usersCollection = db.collection("users");

    // Get user data
    // console.log("👤 Fetching user data...");
    const userData = await usersCollection.findOne({
      _id: new ObjectId(tokenData.userId),
    });
    if (!userData) {
      // console.log("❌ User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // console.log("✅ User data found:", {
    //   subscriptionType: userData.subscriptionType,
    //   subscriptionStatus: userData.subscriptionStatus,
    // });

    // Get signals
    // console.log("📊 Fetching signals...");
    const signals = await signalsCollection
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // console.log(`📈 Found ${signals.length} signals in database`);

    // If no signals in database, generate some using the real service
    if (signals.length === 0) {
      // console.log("🔄 No signals in database, generating new ones...");
      const signalService = SignalService.getInstance();
      await signalService.generateAndSaveSignals();

      // Fetch the newly generated signals
      const newSignals = await signalsCollection
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      // console.log(`✅ Generated ${newSignals.length} new signals`);

      // Calculate stats from new signals
      const stats = calculateStats(newSignals);

      return NextResponse.json({
        signals: newSignals,
        stats,
        user: {
          subscriptionType: userData.subscriptionType || "free",
          subscriptionStatus: userData.subscriptionStatus || "inactive",
          subscriptionEndDate: userData.subscriptionEndDate || null,
        },
      });
    }

    // Calculate stats from existing signals
    const stats = calculateStats(signals);

    // console.log("✅ Returning dashboard data");
    return NextResponse.json({
      signals,
      stats,
      user: {
        subscriptionType: userData.subscriptionType || "free",
        subscriptionStatus: userData.subscriptionStatus || "inactive",
        subscriptionEndDate: userData.subscriptionEndDate || null,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function calculateStats(signals: any[]) {
  const totalSignals = signals.length;
  const activeSignals = signals.filter((s) => s.isActive).length;

  // Calculate win rate from completed signals
  const completedSignals = signals.filter((s) => s.status === "completed");
  const winningSignals = completedSignals.filter((s) => s.profit > 0);
  const winRate =
    completedSignals.length > 0
      ? (winningSignals.length / completedSignals.length) * 100
      : 0;

  // Calculate average profit
  const avgProfit =
    completedSignals.length > 0
      ? completedSignals.reduce((sum, s) => sum + (s.profit || 0), 0) /
        completedSignals.length
      : 0;

  return {
    totalSignals,
    winRate,
    avgProfit,
    activeSignals,
  };
}
