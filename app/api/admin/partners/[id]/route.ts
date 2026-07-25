import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET( req: NextRequest,  { params }: { params: Promise<{ id: string }> }) {
  try {

    const { id } = await params;
  
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    // if (decoded?.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const db = await getDatabase();
    
    // 1. Get the Partner
    const partner = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const referralCode = partner.partnerProfile?.referralCode;
    const revShare = partner.partnerProfile?.revenueShare || 0;

    // 2. Aggregate Referred Users with their Subscriptions
    const referrals = await db.collection("users").aggregate([
      { $match: { refereer: referralCode } },
      {
        $addFields: { userIdStr: { $toString: "$_id" } }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "userIdStr",
          foreignField: "userId",
          as: "subs"
        }
      },
      {
        $addFields: {
          // Get the active subscription
          activeSub: {
            $first: {
              $filter: {
                input: "$subs",
                as: "s",
                cond: { $eq: ["$$s.status", "active"] }
              }
            }
          }
        }
      },
      {
        $project: {
          email: 1,
          createdAt: 1,
          commissionGenerated: { 
            $multiply: [{ $ifNull: ["$activeSub.amount", 0] }, revShare] 
          },
          isPaid: { $gt: [{ $ifNull: ["$activeSub.amount", 0] }, 0] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return NextResponse.json({
      partner: {
        email: partner.email,
        referralCode,
        revenueShare: revShare
      },
      referrals
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// import { getDatabase } from "@/lib/mongodb";
// import { ObjectId } from "mongodb";
// import { NextRequest, NextResponse } from "next/server";
// import { verifyToken } from "@/lib/auth";

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token || "");

//     // if (decoded?.role !== "admin") {
//     //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
//     // }

//     const db = await getDatabase();
    
//     // 1. Get the Partner
//     const partner = await db.collection("users").findOne({ _id: new ObjectId(params.id) });
//     if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

//     const referralCode = partner.partnerProfile?.referralCode;
//     const revShare = partner.partnerProfile?.revenueShare || 0;

//     // 2. Aggregate Referred Users with their Subscriptions
//     const referrals = await db.collection("users").aggregate([
//       { $match: { refereer: referralCode } },
//       {
//         $addFields: { userIdStr: { $toString: "$_id" } }
//       },
//       {
//         $lookup: {
//           from: "subscriptions",
//           localField: "userIdStr",
//           foreignField: "userId",
//           as: "subs"
//         }
//       },
//       {
//         $addFields: {
//           // Get the active subscription
//           activeSub: {
//             $first: {
//               $filter: {
//                 input: "$subs",
//                 as: "s",
//                 cond: { $eq: ["$$s.status", "active"] }
//               }
//             }
//           }
//         }
//       },
//       {
//         $project: {
//           email: 1,
//           createdAt: 1,
//           commissionGenerated: { 
//             $multiply: [{ $ifNull: ["$activeSub.amount", 0] }, revShare] 
//           },
//           isPaid: { $gt: [{ $ifNull: ["$activeSub.amount", 0] }, 0] }
//         }
//       },
//       { $sort: { createdAt: -1 } }
//     ]).toArray();

//     return NextResponse.json({
//       partner: {
//         email: partner.email,
//         referralCode,
//         revenueShare: revShare
//       },
//       referrals
//     });
//   } catch (err) {
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }


// import { getDatabase } from "@/lib/mongodb";
// import { ObjectId } from "mongodb";
// import { NextRequest, NextResponse } from "next/server";
// import { verifyToken } from "@/lib/auth";

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token || "");

//     // if (decoded?.role !== "admin") {
//     //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
//     // }

//     const db = await getDatabase();
    
//     // 1. Get the Partner Details
//     const partner = await db.collection("users").findOne({ 
//       _id: new ObjectId(params.id) 
//     });

//     if (!partner) {
//       return NextResponse.json({ error: "Partner not found" }, { status: 404 });
//     }

//     const referralCode = partner.partnerProfile?.referralCode;

//     // 2. Find all users referred by this partner
//     const referredUsers = await db.collection("users")
//       .find({ refereer: referralCode })
//       .project({ password: 0 }) // Security: hide passwords
//       .sort({ createdAt: -1 })
//       .toArray();

//     return NextResponse.json({
//       partner: {
//         email: partner.email,
//         referralCode: referralCode,
//         role: partner.role
//       },
//       referrals: referredUsers
//     });
//   } catch (err) {
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }