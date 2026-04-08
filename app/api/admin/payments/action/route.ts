import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { PLANS } from "@/lib/plans";
import { convertKesToUsd, getKesToUsdRate } from "@/lib/currency-rates";
import { normalizePaymentChannel } from "@/lib/payment-provider";
import { computeMismatch, normalizeMoney } from "@/lib/payment-amounts";

export async function PATCH(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);

    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { intentId, action } = await req.json();
    const db = await getDatabase();

    const intent = await db.collection("payment_intents").findOne({
      _id: new ObjectId(intentId),
    });

    if (!intent) {
      return NextResponse.json({ error: "Intent not found" }, { status: 404 });
    }

    const userId = intent.userId;

    /* ------------------------------------
       REJECT FLOW
    ------------------------------------ */
    if (action === "reject") {
      await db.collection("payment_intents").updateMany(
        { userId, status: { $ne: "success" } },
        {
          $set: {
            status: "declined",
            processedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        message: "All user payment intents rejected",
      });
    }

    /* ------------------------------------
       APPROVE FLOW
    ------------------------------------ */
    if (action === "approve") {
      const normalizedIntentPlanId = String(intent.planId || "")
        .toLowerCase()
        .replace(/\s+/g, "");
      const plan = PLANS.find((p: any) => {
        const planId = String(p.id || "")
          .toLowerCase()
          .replace(/\s+/g, "");
        const altPlanId = String((p as any).planId || "")
          .toLowerCase()
          .replace(/\s+/g, "");
        const planName = String(p.name || "")
          .toLowerCase()
          .replace(/\s+/g, "");
        return (
          planId === normalizedIntentPlanId ||
          altPlanId === normalizedIntentPlanId ||
          planName === normalizedIntentPlanId
        );
      });
      if (!plan) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      const durationDays = plan.duration;

      // 1️⃣ Reject ALL other intents for this user
      await db.collection("payment_intents").updateMany(
        {
          userId,
          _id: { $ne: new ObjectId(intentId) },
        },
        {
          $set: {
            status: "declined",
            processedAt: new Date(),
          },
        }
      );

      let amountUsd: number | null = null;
      let fxRateKesToUsd: number | null = null;
      let fxSource: string | null = null;
      let fxFetchedAt: Date | null = null;

      const amountKes = normalizeMoney(
        intent.amountKes ??
          (String(intent.currency || "").toUpperCase() === "KES"
            ? intent.amount
            : 0),
      ) ?? 0;
      if (amountKes > 0) {
        try {
          const fx = await getKesToUsdRate(db, { forceRefresh: true });
          fxRateKesToUsd = fx.rate;
          fxSource = fx.source;
          fxFetchedAt = fx.fetchedAt;
          amountUsd = convertKesToUsd(amountKes, fx.rate);
        } catch (fxErr) {
          console.error("FX conversion failed during manual approval:", fxErr);
        }
      } else if (String(intent.currency || "").toUpperCase() === "USD") {
        amountUsd = normalizeMoney(intent.amount, 2);
      }
      const expectedAmountKes = normalizeMoney(intent.expectedAmountKes, 2) ?? 0;
      const expectedAmountUsd = normalizeMoney(intent.expectedAmountUsd, 2) ?? 0;
      const amountMismatch =
        computeMismatch(amountKes, expectedAmountKes, 100, 2) ||
        computeMismatch(amountUsd, expectedAmountUsd, 1, 2);

      // 2️⃣ Approve selected intent
      await db.collection("payment_intents").updateOne(
        { _id: new ObjectId(intentId) },
        {
          $set: {
            status: "success",
            processedAt: new Date(),
            amountKes: amountKes > 0 ? amountKes : null,
            currencyKes: amountKes > 0 ? "KES" : null,
            amountUsd,
            currencyUsd: amountUsd != null ? "USD" : null,
            amount_paid_original:
              amountKes > 0 ? amountKes : amountUsd != null ? amountUsd : null,
            currency_original:
              amountKes > 0 ? "KES" : amountUsd != null ? "USD" : null,
            amount_converted:
              amountKes > 0 ? amountKes : amountUsd != null ? amountUsd : null,
            exchange_rate_used: amountKes > 0 ? 1 : null,
            fxRateKesToUsd,
            fxSource,
            fxFetchedAt,
            expectedAmountKes: expectedAmountKes > 0 ? expectedAmountKes : null,
            expectedAmountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
            amountMismatch,
          },
        }
      );

      // 3️⃣ Handle subscription stacking
      const existingSub = await db.collection("subscriptions").findOne({
        userId,
        status: "active",
      });

      let startDate = new Date();
      if (existingSub && existingSub.endDate > startDate) {
        startDate = new Date(existingSub.endDate);
      }

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      // 4️⃣ Upsert subscription
      await db.collection("subscriptions").updateOne(
        { userId },
        {
          $set: {
            userId,
            planId: intent.planId,
            amount: amountKes > 0 ? amountKes : intent.amount,
            currency:
              amountKes > 0
                ? "KES"
                : String(intent.currency || "USD").toUpperCase(),
            amountKes: amountKes > 0 ? amountKes : null,
            currencyKes: amountKes > 0 ? "KES" : null,
            amountUsd,
            currencyUsd: amountUsd != null ? "USD" : null,
            amount_paid_original:
              amountKes > 0 ? amountKes : amountUsd != null ? amountUsd : null,
            currency_original:
              amountKes > 0 ? "KES" : amountUsd != null ? "USD" : null,
            amount_converted:
              amountKes > 0 ? amountKes : amountUsd != null ? amountUsd : null,
            exchange_rate_used: amountKes > 0 ? 1 : null,
            fxRateKesToUsd,
            fxSource,
            fxFetchedAt,
            expectedAmountKes: expectedAmountKes > 0 ? expectedAmountKes : null,
            expectedAmountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
            amountMismatch,
            provider: intent.provider || null,
            paymentChannel: normalizePaymentChannel(intent.provider),
            status: "active",
            startDate,
            endDate,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // 5️⃣ Update user profile
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            subscriptionStatus: "active",
            subscriptionType: intent.planId,
            subscriptionEndDate: endDate,
          },
        }
      );

      return NextResponse.json({
        message: "Payment approved, subscription stacked correctly",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// import { verifyToken } from '@/lib/auth';
// import { getDatabase } from '@/lib/mongodb';
// import { NextResponse } from 'next/server';
// import { ObjectId } from 'mongodb';
// import { PLANS } from '@/lib/plans';

// export async function PATCH(req: Request) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token!);

//     if (!decoded || !decoded.isAdmin) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { intentId, action } = await req.json();
//     const db = await getDatabase();

//     // 1. Find the intent
//     const intent = await db.collection("payment_intents").findOne({ _id: new ObjectId(intentId) });
//     if (!intent) return NextResponse.json({ error: "Intent not found" }, { status: 404 });

//     if (action === "reject") {
//       await db.collection("payment_intents").updateOne(
//         { _id: new ObjectId(intentId) },
//         { $set: { status: "declined", processedAt: new Date() } }
//       );
//       return NextResponse.json({ message: "Payment declined" });
//     }

//     if (action === "approve") {
//       const plan = PLANS.find(p => p.id === intent.planId);
//       const durationDays = plan?.duration || 30;

//       // 2. Update Intent Status
//       await db.collection("payment_intents").updateOne(
//         { _id: new ObjectId(intentId) },
//         { $set: { status: "success", processedAt: new Date() } }
//       );

//       // 3. Upsert Subscription
//       const endDate = new Date();
//       endDate.setDate(endDate.getDate() + durationDays);

//       await db.collection("subscriptions").updateOne(
//         { userId: intent.userId },
//         {
//           $set: {
//             userId: intent.userId,
//             planId: intent.planId,
//             amount: intent.amount,
//             status: "active",
//             startDate: new Date(),
//             endDate: endDate,
//             updatedAt: new Date()
//           }
//         },
//         { upsert: true }
//       );

//       // 4. Update User Profile Status
//       await db.collection("users").updateOne(
//         { _id: new ObjectId(intent.userId) },
//         { 
//           $set: { 
//             subscriptionStatus: "active",
//             subscriptionType: intent.planId,
//             subscriptionEndDate: endDate
//           } 
//         }
//       );

//       return NextResponse.json({ message: "Payment verified and subscription activated" });
//     }
//   } catch (error) {
//     return NextResponse.json({ error: "Internal Error" }, { status: 500 });
//   }
// }