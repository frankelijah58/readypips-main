import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '5'), 1);
    const skip = (page - 1) * limit;

    const db = await getDatabase();

    const result = await db.collection('payment_intents').aggregate([
      // 1. Filter for pending status first for performance
      { $match: { status: 'pending' } },

      // 2. CONVERSION: Ensure userId matches the User collection _id type
      {
        $addFields: {
          convertedUserId: { 
            $cond: { 
              if: { $ne: ["$userId", null] }, 
              then: { $toObjectId: "$userId" }, 
              else: null 
            } 
          }
        }
      },

      // 3. Lookup User details
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      // 4. Group results into Data and Total Count
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                reference: 1,
                planId: 1,
                provider: 1,
                amount: 1,
                createdAt: 1,
                email: 1,
                userName: {
                  $ifNull: [
                    { $trim: { input: { $concat: ['$user.firstName', ' ', '$user.lastName'] } } },
                    'Guest User'
                  ]
                },
                phoneNumber: { $ifNull: ['$user.phoneNumber', 'No Phone'] }
              }
            }
          ]
        }
      }
    ]).toArray();

    // 5. Format the response
    const pending = result[0]?.data || [];
    const totalCount = result[0]?.metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      pending,
      totalCount,
      totalPages,
      currentPage: page
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