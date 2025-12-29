import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { updateUserSubscription } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import crypto from "crypto";

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
      const intent = await db.collection("payment_intents").findOne({ reference, status: "pending" });

      if (intent) {
        const planConfig = PLANS.find(p => p.id === intent.planId);
        const duration = planConfig?.duration || 30;
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        // Update User Profile
        await updateUserSubscription(intent.userId, {
          subscriptionStatus: "active",
          subscriptionType: intent.planId as any,
          subscriptionEndDate: endDate,
          subscriptionStartDate: new Date(),
        });

        // Mark intent as used
        await db.collection("payment_intents").updateOne(
          { reference },
          { $set: { status: "completed", updatedAt: new Date() } }
        );
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