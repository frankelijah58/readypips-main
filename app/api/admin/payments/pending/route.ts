import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '5'), 1);
    const skip = (page - 1) * limit;

    const db = await getDatabase();

    const totalCount = await db
      .collection('payment_intents')
      .countDocuments({ status: 'pending' });

    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

    // 🔒 Clamp page to avoid empty results
    const safePage = Math.min(page, totalPages);
    const safeSkip = (safePage - 1) * limit;

    const pending = await db
      .collection('payment_intents')
      .aggregate([
        { $match: { status: 'pending' } },
        { $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
        }},
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: {
            _id: 1,
            reference: 1,
            planId: 1,
            provider: 1,
            amount: 1,
            createdAt: 1,
            email: 1,
            userName: {
              $trim: {
                input: {
                  $concat: ['$user.firstName', ' ', '$user.lastName']
                }
              }
            },
            phoneNumber: '$user.phoneNumber'
        }},
        { $sort: { createdAt: -1 } },
        { $skip: safeSkip },
        { $limit: limit }
      ])
      .toArray();

    return NextResponse.json({
      pending,
      page: safePage,
      limit,
      totalCount,
      totalPages
    });
  } catch (error) {
    console.error('Pending payments API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "5");
//     const skip = (page - 1) * limit;

//     const db = await getDatabase();
    
//     // Get total count for pagination
//     const totalPending = await db.collection("payment_intents").countDocuments({ status: "pending" });

//     const pending = await db.collection("payment_intents").aggregate([
//       { $match: { status: "pending" } },
//       { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
//       { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
//       { $project: { 
//           _id: 1, reference: 1, planId: 1, provider: 1, amount: 1, 
//           createdAt: 1, email: 1, 
//           userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
//           phoneNumber: "$user.phoneNumber" 
//       }},
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: limit }
//     ]).toArray();

//     return NextResponse.json({ pending, totalPages: Math.ceil(totalPending / limit) });
//   } catch (error) {
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }

// export async function GET(req: Request) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token!);

//     if (!decoded || decoded.isAdmin !== true) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const db = await getDatabase();

//     const { searchParams } = new URL(req.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const skip = (page - 1) * limit;

//     // Fetch pending intents and join with users to see who they are
//     const pending = await db.collection("payment_intents").aggregate([
//       { $match: { status: "pending" } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "user"
//         }
//       },
//       { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
//       {
//         $project: {
//           _id: 1,
//           reference: 1,
//           planId: 1,
//           provider: 1,
//           amount: 1,
//           createdAt: 1,
//           email: 1,
//           userName: { $concat: ["$user.firstName", " ", "$user.lastName"] }
//         }
//       },
//       { $sort: { createdAt: -1 } },
//       { $sort: { startDate: -1 } },
//       { $skip: skip },
//       { $limit: limit }
//     ]).toArray();

//     return NextResponse.json({ pending });
//   } catch (error) {
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }