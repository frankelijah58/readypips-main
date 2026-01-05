import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { PLANS } from '@/lib/plans';

export async function PATCH(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);

    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { intentId, action } = await req.json();
    const db = await getDatabase();

    // 1. Find the intent
    const intent = await db.collection("payment_intents").findOne({ _id: new ObjectId(intentId) });
    if (!intent) return NextResponse.json({ error: "Intent not found" }, { status: 404 });

    if (action === "reject") {
      await db.collection("payment_intents").updateOne(
        { _id: new ObjectId(intentId) },
        { $set: { status: "declined", processedAt: new Date() } }
      );
      return NextResponse.json({ message: "Payment declined" });
    }

    if (action === "approve") {
      const plan = PLANS.find(p => p.id === intent.planId);
      const durationDays = plan?.duration || 30;

      // 2. Update Intent Status
      await db.collection("payment_intents").updateOne(
        { _id: new ObjectId(intentId) },
        { $set: { status: "success", processedAt: new Date() } }
      );

      // 3. Upsert Subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      await db.collection("subscriptions").updateOne(
        { userId: intent.userId },
        {
          $set: {
            userId: intent.userId,
            planId: intent.planId,
            amount: intent.amount,
            status: "active",
            startDate: new Date(),
            endDate: endDate,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      // 4. Update User Profile Status
      await db.collection("users").updateOne(
        { _id: new ObjectId(intent.userId) },
        { 
          $set: { 
            subscriptionStatus: "active",
            subscriptionType: intent.planId,
            subscriptionEndDate: endDate
          } 
        }
      );

      return NextResponse.json({ message: "Payment verified and subscription activated" });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}