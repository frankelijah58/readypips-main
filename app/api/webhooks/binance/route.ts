import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { PLANS } from "@/lib/plans";
import crypto from "crypto";
import { normalizePaymentChannel } from "@/lib/payment-provider";
import { computeMismatch, normalizeMoney } from "@/lib/payment-amounts";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("BinancePay-Signature");
    const timestamp = req.headers.get("BinancePay-Timestamp");
    const nonce = req.headers.get("BinancePay-Nonce");

    // 1. Verify it's actually Binance calling
    const secret = process.env.BINANCE_PAY_SECRET!;
    const payload = `${timestamp}\n${nonce}\n${rawBody}\n`;
    const expectedSig = crypto.createHmac("sha512", secret).update(payload).digest("hex").toUpperCase();

    if (signature !== expectedSig) {
      return NextResponse.json({ returnCode: "FAIL", returnMessage: "Invalid Signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // 2. Process successful payment
    if (body.bizStatus === "PAY_SUCCESS") {
      const data = JSON.parse(body.data);
      const reference = data.merchantTradeNo;

      const db = await getDatabase();
      const intent = await db.collection("payment_intents").findOne({
        reference,
        status: { $in: ["pending", "initiated"] },
      });

      if (intent) {
        const planConfig = PLANS.find((p: any) => {
          const normalizedIntentPlan = String(intent.planId || "")
            .toLowerCase()
            .replace(/\s+/g, "");
          const pid = String(p.id || "").toLowerCase().replace(/\s+/g, "");
          const ppid = String((p as any).planId || "")
            .toLowerCase()
            .replace(/\s+/g, "");
          const pname = String(p.name || "").toLowerCase().replace(/\s+/g, "");
          return (
            pid === normalizedIntentPlan ||
            ppid === normalizedIntentPlan ||
            pname === normalizedIntentPlan
          );
        });
        const duration = Number(planConfig?.duration || intent.duration || 30);
        const userId = intent.userId;
        const paidAmountUsd = normalizeMoney(
          data?.totalFee || data?.orderAmount || intent.amountUsd || intent.amount || 0,
          2
        ) ?? 0;
        const expectedAmountUsd = normalizeMoney(
          intent.expectedAmountUsd ?? planConfig?.usd ?? 0,
          2
        ) ?? 0;
        const amountMismatch = computeMismatch(paidAmountUsd, expectedAmountUsd, 1, 2);

        await db.collection("payment_intents").updateMany(
          {
            userId,
            _id: { $ne: intent._id },
            status: { $ne: "success" },
          },
          { $set: { status: "declined", processedAt: new Date(), updatedAt: new Date() } }
        );

        await db.collection("payment_intents").updateOne(
          { _id: intent._id },
          {
            $set: {
              status: "success",
              processedAt: new Date(),
              amount: paidAmountUsd,
              currency: "USD",
              amountUsd: paidAmountUsd,
              currencyUsd: "USD",
              amount_paid_original: paidAmountUsd,
              currency_original: "USD",
              amount_converted: paidAmountUsd,
              exchange_rate_used: 1,
              expectedAmountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
              amountMismatch,
              amountSource: "binance_webhook",
              rawBinanceWebhook: body,
              updatedAt: new Date(),
            },
          }
        );

        const existingSub = await db.collection("subscriptions").findOne({
          userId,
          status: "active",
        });
        let startDate = new Date();
        if (existingSub?.endDate && new Date(existingSub.endDate) > startDate) {
          startDate = new Date(existingSub.endDate);
        }
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);

        await db.collection("subscriptions").updateOne(
          { userId },
          {
            $set: {
              userId,
              planId: intent.planId,
              amount: paidAmountUsd,
              currency: "USD",
              amountUsd: paidAmountUsd,
              currencyUsd: "USD",
              amount_paid_original: paidAmountUsd,
              currency_original: "USD",
              amount_converted: paidAmountUsd,
              exchange_rate_used: 1,
              expectedAmountUsd: expectedAmountUsd > 0 ? expectedAmountUsd : null,
              amountMismatch,
              provider: "binance",
              paymentChannel: normalizePaymentChannel("binance"),
              status: "active",
              startDate,
              endDate,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );

        if (ObjectId.isValid(String(userId || ""))) {
          await db.collection("users").updateOne(
            { _id: new ObjectId(String(userId)) },
            {
              $set: {
                subscriptionStatus: "active",
                subscriptionType: intent.planId,
                subscriptionEndDate: endDate,
                updatedAt: new Date(),
              },
            }
          );
        }
      }
    }

    // 3. Binance MANDATORY success response
    return NextResponse.json({ 
      returnCode: "SUCCESS", 
      returnMessage: null 
    });

  } catch (error) {
    console.error("Binance Webhook Error:", error);
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "Error" }, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { getDatabase } from "@/lib/mongodb";
// import { updateUserSubscription } from "@/lib/auth";
// import { PLANS } from "@/lib/plans";
// import crypto from "crypto";

// export async function POST(req: NextRequest) {
//   try {
//     // 1. Get raw body and headers for verification
//     const rawBody = await req.text();
//     const signature = req.headers.get("BinancePay-Signature");
//     const timestamp = req.headers.get("BinancePay-Timestamp");
//     const nonce = req.headers.get("BinancePay-Nonce");

//     // 2. Verify Signature (Crucial for Security)
//     if (!verifySignature(rawBody, signature, timestamp, nonce)) {
//       return NextResponse.json({ returnCode: "FAIL", returnMsg: "Invalid Signature" }, { status: 401 });
//     }

//     const body = JSON.parse(rawBody);

//     // 3. Check for Successful Payment
//     // bizStatus "PAY_SUCCESS" is the standard for a completed order
//     if (body.bizStatus === "PAY_SUCCESS") {
//       const data = JSON.parse(body.data);
//       const reference = data.merchantTradeNo; // This is our UUID/Reference

//       const db = await getDatabase();
//       const intent = await db.collection("payment_intents").findOne({ 
//         reference: reference,
//         status: "pending" 
//       });

//       if (intent) {
//         const planConfig = PLANS.find(p => p.id === intent.planId);
//         if (planConfig) {
//           const endDate = new Date();
//           endDate.setDate(endDate.getDate() + planConfig.duration);

//           // Update User
//           await updateUserSubscription(intent.userId, {
//             subscriptionStatus: "active",
//             subscriptionType: intent.planId as any,
//             subscriptionEndDate: endDate,
//             subscriptionStartDate: new Date(),
//           });

//           // Mark Intent Completed
//           await db.collection("payment_intents").updateOne(
//             { reference: reference },
//             { $set: { status: "completed", updatedAt: new Date() } }
//           );
//         }
//       }
//     }

//     // 4. Return the specific success format Binance expects
//     return NextResponse.json({ 
//       returnCode: "SUCCESS", 
//       returnMessage: null 
//     });

//   } catch (error) {
//     console.error("Binance Webhook Error:", error);
//     return NextResponse.json({ returnCode: "FAIL", returnMessage: "Error" }, { status: 500 });
//   }
// }

// // Security Helper
// function verifySignature(body: string, sig: string | null, ts: string | null, nonce: string | null) {
//   if (!sig || !ts || !nonce) return false;
  
//   const secret = process.env.BINANCE_PAY_SECRET!;
//   const payload = `${ts}\n${nonce}\n${body}\n`;
  
//   const expectedSig = crypto
//     .createHmac("sha512", secret)
//     .update(payload)
//     .digest("hex")
//     .toUpperCase();

//   return expectedSig === sig;
// }

// // import crypto from "crypto";
// // import { NextRequest, NextResponse } from "next/server";

// // // Verification helper function
// // function verifyBinanceSignature(payload: string, signature: string, timestamp: string, nonce: string) {
// //   const BINANCE_PAY_SECRET = process.env.BINANCE_PAY_SECRET!;
  
// //   // Binance payload format: timestamp + "\n" + nonce + "\n" + body + "\n"
// //   const verificationPayload = `${timestamp}\n${nonce}\n${payload}\n`;
  
// //   const expectedSignature = crypto
// //     .createHmac("sha512", BINANCE_PAY_SECRET)
// //     .update(verificationPayload)
// //     .digest("hex")
// //     .toUpperCase();

// //   return expectedSignature === signature;
// // }

// // export async function POST(req: NextRequest) {
// //   const bodyText = await req.text(); // Get raw body for verification
// //   const signature = req.headers.get("BinancePay-Signature") || "";
// //   const timestamp = req.headers.get("BinancePay-Timestamp") || "";
// //   const nonce = req.headers.get("BinancePay-Nonce") || "";

// //   if (!verifyBinanceSignature(bodyText, signature, timestamp, nonce)) {
// //     return NextResponse.json({ returnCode: "FAIL", returnMsg: "Invalid Signature" }, { status: 401 });
// //   }

// //   const body = JSON.parse(bodyText);
// //   // ... proceed with your subscription logic ...
// // }