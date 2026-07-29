import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken, findUserById } from "@/lib/auth";
import { ObjectId } from "mongodb";

// POST - Save MT5 credentials after challenge payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mt5_login,
      mt5_password,
      investor_password,
      server,
      group,
      balance,
      leverage,
      paymentReference,
    } = body;

    // Validate required fields
    if (!mt5_login || !mt5_password || !server) {
      return NextResponse.json(
        {
          success: false,
          message: "MT5 login, password, and server are required.",
        },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Invalid token." },
        { status: 401 }
      );
    }

    const finalUserId = decoded.userId || decoded.id || null;
    let userEmail = decoded.email || "";
    if (!userEmail && finalUserId) {
      const user = await findUserById(finalUserId);
      userEmail = user?.email || "";
    }

    const db = await getDatabase();

    // Verify the user has a paid challenge payment
    const query: any = {
      userId: finalUserId,
      type: "challenge_payment",
      status: "paid",
    };
    if (paymentReference) {
      query.reference = paymentReference;
    }

    const paidIntent = await db.collection("payment_intents").findOne(query);

    if (!paidIntent) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No paid challenge found. Please complete the $42.99 payment first.",
        },
        { status: 403 }
      );
    }

    // Check if credentials already exist for this user
    const existing = await db.collection("challenge_participants").findOne({
      userId: finalUserId,
    });

    const credentialsData = {
      userId: finalUserId,
      email: userEmail,
      paymentReference: paidIntent.reference,
      paymentIntentId: paidIntent._id,
      mt5_login: String(mt5_login),
      mt5_password: String(mt5_password),
      investor_password: investor_password ? String(investor_password) : null,
      server: String(server),
      group: group || "Starter Challenge",
      balance: Number(balance) || 500,
      leverage: leverage || "1:100",
      status: "active",
      // Leaderboard fields
      rank: 0,
      profit: 0,
      profitPercent: 0,
      trades: 0,
      winRate: 0,
      displayName: userEmail?.split("@")[0] || "Trader",
      // Metadata
      challengeName: paidIntent.planName || "Starter Challenge",
      challengeStartedAt: new Date(),
      challengeEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing) {
      // Update existing credentials
      await db.collection("challenge_participants").updateOne(
        { _id: existing._id },
        {
          $set: {
            mt5_login: credentialsData.mt5_login,
            mt5_password: credentialsData.mt5_password,
            investor_password: credentialsData.investor_password,
            server: credentialsData.server,
            group: credentialsData.group,
            balance: credentialsData.balance,
            leverage: credentialsData.leverage,
            status: "active",
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "MT5 credentials updated successfully.",
        participantId: existing._id,
      });
    }

    // Insert new credentials
    const result = await db
      .collection("challenge_participants")
      .insertOne(credentialsData);

    return NextResponse.json({
      success: true,
      message: "MT5 credentials saved successfully. The competition has started!",
      participantId: result.insertedId,
    });
  } catch (error: any) {
    console.error("MT5 credentials save error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to save MT5 credentials.",
      },
      { status: 500 }
    );
  }
}

// GET - Fetch current user's MT5 credentials / challenge status
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Invalid token." },
        { status: 401 }
      );
    }

    const finalUserId = decoded.userId || decoded.id || null;
    const db = await getDatabase();

    // Check if user has a paid challenge
    const paidIntent = await db.collection("payment_intents").findOne({
      userId: finalUserId,
      type: "challenge_payment",
      status: "paid",
    });

    // Check if user has submitted MT5 credentials
    const participant = await db.collection("challenge_participants").findOne({
      userId: finalUserId,
    });

    return NextResponse.json({
      success: true,
      hasPaid: !!paidIntent,
      hasSubmittedCredentials: !!participant,
      participant: participant
        ? {
            _id: participant._id,
            mt5_login: participant.mt5_login,
            server: participant.server,
            group: participant.group,
            balance: participant.balance,
            leverage: participant.leverage,
            status: participant.status,
            rank: participant.rank,
            profit: participant.profit,
            displayName: participant.displayName,
            challengeStartedAt: participant.challengeStartedAt,
            challengeEndsAt: participant.challengeEndsAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error("MT5 credentials fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch challenge status.",
      },
      { status: 500 }
    );
  }
}