import { verifyToken } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const partnerId = new ObjectId(decoded.userId);

    /* 1️⃣ Load partner */
    const partner = await db.collection("users").findOne({ _id: partnerId });

    if (
      !partner ||
      partner.role !== "partner" ||
      !partner.partnerProfile?.referralCode
    ) {
      return NextResponse.json(
        { error: "Partner profile not found" },
        { status: 404 }
      );
    }

    const { referralCode, revenueShare } = partner.partnerProfile;

    /* 2️⃣ Aggregate referrals */
    const referrals = await db
      .collection("users")
      .aggregate([
        // ✅ FIX #1: correct field name
        { $match: { refereer: referralCode } },

        // ✅ FIX #2: cast _id → string
        {
          $addFields: {
            userIdStr: { $toString: "$_id" },
          },
        },

        {
          $lookup: {
            from: "subscriptions",
            localField: "userIdStr",
            foreignField: "userId",
            as: "subscriptions",
          },
        },

        {
          $addFields: {
            subscription: {
              $first: {
                $filter: {
                  input: "$subscriptions",
                  as: "sub",
                  cond: { $eq: ["$$sub.status", "active"] },
                },
              },
            },
          },
        },

        {
          $addFields: {
            hasPaid: { $cond: [{ $ifNull: ["$subscription", false] }, true, false] },
            commission: {
              $cond: [
                { $ifNull: ["$subscription", false] },
                { $multiply: ["$subscription.amount", revenueShare] },
                0,
              ],
            },
          },
        },

        {
          $project: {
            password: 0,
            subscriptions: 0,
            userIdStr: 0,
            partnerProfile: 0,
          },
        },

        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    /* 3️⃣ Stats */
    const paid = referrals.filter(r => r.hasPaid);
    const pending = referrals.filter(r => !r.hasPaid);

    const totalRevenue = paid.reduce((sum, r) => sum + r.commission, 0);

    return NextResponse.json({
      referralCode: `https://readypips.com/ref/${referralCode}`,
      stats: {
        totalReferrals: referrals.length,
        paidReferrals: paid.length,
        pendingReferrals: pending.length,
        totalRevenue,
        conversionRate:
          referrals.length > 0
            ? `${((paid.length / referrals.length) * 100).toFixed(1)}%`
            : "0%",
      },
      referrals: referrals.map(r => ({
        _id: r._id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        hasPaid: r.hasPaid,
        commission: r.commission,
        subscription: r.subscription,
        createdAt: r.createdAt,
        // "firstName": "rof",
        //     "lastName": "ozds",
        //     "email": "etest@gmail.com",
        //     "phoneNumber": "0708988769",
        //     "subscriptionStatus": "active",
        //     "subscriptionType": "monthly",
        //     "subscriptionEndDate": "2026-02-04T08:26:25.273Z",
        //     "refereer": "rp-98fd17",
        //     "freeTrialEndDate": "2026-01-01T15:23:38.961Z",
        //     "createdAt": "2025-12-29T15:23:38.961Z",
        //     "updatedAt": "2026-01-05T06:52:04.026Z",
        //     "emailVerified": true,
        //     "isAdmin": true,
        //     "emailVerifiedAt": "2025-12-29T15:25:51.922Z",
        //     "role": "affiliate",
        //     "hasPaid": false,
        //     "commission": 0
      })),
      revenueChart: aggregateByDay(paid),
    });
  } catch (err) {
    console.error("Referral dashboard error:", err);
    return NextResponse.json(
      { error: "Failed to load referral dashboard" },
      { status: 500 }
    );
  }
}

/* 🔹 Revenue grouped by subscription start date */
function aggregateByDay(referrals: any[]) {
  const map: Record<string, number> = {};

  referrals.forEach(r => {
    if (!r.subscription?.startDate) return;

    const key = new Date(r.subscription.startDate).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    });

    map[key] = (map[key] || 0) + r.commission;
  });

  return Object.entries(map).map(([name, revenue]) => ({
    name,
    revenue,
  }));
}



// import { verifyToken } from "@/lib/auth";
// import { getDatabase } from "@/lib/mongodb";
// import { ObjectId } from "mongodb";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token!);

//     if (!decoded) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const db = await getDatabase();
//     const userId = new ObjectId(decoded.userId);

//     // 1️⃣ Load partner
//     const partner = await db.collection("users").findOne({ _id: userId });

//     if (!partner?.partnerProfile?.referralCode) {
//       return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
//     }

//     const referralCode = partner.partnerProfile.referralCode;

//     // 2️⃣ Load referred users
//     const referrals = await db
//       .collection("users")
//       .find({ refereer: referralCode })
//       .sort({ createdAt: -1 })
//       .toArray();

//     // 3️⃣ Paid vs unpaid
//     const paidReferrals = referrals.filter(r => r.subscriptionStatus === "active");
//     const unpaidReferrals = referrals.filter(r => r.subscriptionStatus !== "active");

//     // 4️⃣ Revenue (simple flat example — adjust if tiered)
//     const totalRevenue = paidReferrals.length * 20; // example $20/month

//     return NextResponse.json({
//       referralCode: `https://readypips.com/ref/${referralCode}`,
//       stats: {
//         totalRevenue,
//         activeReferrals: referrals.length,
//         paidReferrals: paidReferrals.length,
//         unpaidReferrals: unpaidReferrals.length,
//         conversionRate:
//           referrals.length > 0
//             ? `${((paidReferrals.length / referrals.length) * 100).toFixed(1)}%`
//             : "0%",
//       },
//       revenueChart: aggregateByDay(paidReferrals),
//       referrals: referrals.map(r => ({
//         id: r._id,
//         email: r.email,
//         hasPaid: r.subscriptionStatus === "active",
//         amount: r.subscriptionStatus === "active" ? 20 : 0,
//         createdAt: r.createdAt,
//       })),
//     });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Dashboard load failed" }, { status: 500 });
//   }
// }

// /**
//  * Aggregates paid revenue per day
//  */
// function aggregateByDay(users: any[]) {
//   const map: Record<string, number> = {};

//   users.forEach(u => {
//     const key = new Date(u.createdAt).toLocaleDateString("en-US", {
//       month: "2-digit",
//       day: "2-digit",
//     });

//     map[key] = (map[key] || 0) + 20;
//   });

//   return Object.entries(map).map(([name, revenue]) => ({
//     name,
//     revenue,
//   }));
// }

// import { verifyToken } from '@/lib/auth';
// import { getDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';
// import { NextRequest, NextResponse } from 'next/server';
// import nodemailer from 'nodemailer';

// // Configure your email service
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// // /api/partner/dashboard/route.ts
// export async function GET(req: NextRequest) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token!);
    
//     if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const db = await getDatabase();
//     const userId = new ObjectId(decoded.userId);

//     // 1. Fetch the user to get their stored referralCode
//     const user = await db.collection("users").findOne({ _id: userId });
    
//     if (!user || !user.partnerProfile) {
//       return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
//     }

//     const { referralCode } = user.partnerProfile;

//     // 2. Fetch referrals (assumes your 'referrals' collection uses partnerId or referralCode)
//     const referrals = await db.collection("referrals")
//       .find({ partnerId: userId }) 
//       .sort({ createdAt: -1 })
//       .toArray();

//     // 3. Analytics Calculations
//     const totalRevenue = referrals.reduce((sum, r) => sum + (r.revenue || 0), 0);
    
//     return NextResponse.json({
//       // Combines the base URL with the unique rp-xxxxxx code
//       referralCode: `https://readypips.com/ref/${referralCode}`,
//       stats: {
//         totalRevenue,
//         activeReferrals: referrals.length,
//         conversionRate: referrals.length > 0 ? "3.2%" : "0%",
//       },
//       revenueChart: aggregateByDay(referrals),
//       recentConversions: referrals.slice(0, 5).map(r => ({
//         id: r._id,
//         amount: r.revenue,
//         createdAt: r.createdAt || r.date,
//       })),
//     });
//   } catch (error) {
//     return NextResponse.json({ error: "Dashboard load failed" }, { status: 500 });
//   }
// }

// /**
//  * Aggregates revenue by date for the Recharts component
//  * Returns: { name: "MM/DD", revenue: number }[]
//  */
// function aggregateByDay(referrals: any[]) {
//   const dailyMap: { [key: string]: number } = {};

//   // Group by local date string
//   referrals.forEach((ref) => {
//     const date = new Date(ref.createdAt || ref.date);
//     const dateKey = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
    
//     dailyMap[dateKey] = (dailyMap[dateKey] || 0) + (ref.revenue || 0);
//   });

//   // Convert map to sorted array for the chart
//   return Object.keys(dailyMap)
//     .map((date) => ({
//       name: date, // "name" maps to XAxis dataKey in the UI
//       revenue: dailyMap[date],
//     }))
//     .reverse(); // Ensure chronological order
// }

// // export async function GET(req: NextRequest) {
// //   const decoded = verifyToken(req.headers.get("authorization")?.replace("Bearer ", "")!);
// //   const db = await getDatabase();

// //   if (!decoded) {
// //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //   }

// //   const partnerId = new ObjectId(decoded.userId);

// //   const referrals = await db.collection("referrals").find({ partnerId }).toArray();

// //   const totalRevenue = referrals.reduce((sum, r) => sum + r.revenue, 0);

// //   return NextResponse.json({
// //     referralCode: `https://readypips.com/ref/${decoded.userId}`,
// //     stats: {
// //       totalRevenue,
// //       activeReferrals: referrals.length,
// //       conversionRate: referrals.length ? "3.2%" : "0%",
// //     },
// //     revenueChart: aggregateByDay(referrals),
// //     recentConversions: referrals.slice(-5),
// //   });
// // }


// // function aggregateByDay(referrals: any[]) {
// //   const dailyData: { [key: string]: number } = {};

// //   referrals.forEach((referral) => {
// //     const dateKey = new Date(referral.date).toISOString().split('T')[0];
// //     if (!dailyData[dateKey]) {
// //       dailyData[dateKey] = 0;
// //     }
// //     dailyData[dateKey] += referral.revenue;
// //   });

// //   const result = Object.keys(dailyData).map((date) => ({
// //     date,
// //     revenue: dailyData[date],
// //   }));

// //   return result;
// // }