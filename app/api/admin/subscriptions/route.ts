import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    // 1. Build Match Stage
    const matchStage: any = {};

    // Search logic
    if (search) {
      matchStage.$or = [
        { "userDetails.firstName": { $regex: search, $options: "i" } },
        { "userDetails.lastName": { $regex: search, $options: "i" } },
        { "userDetails.email": { $regex: search, $options: "i" } },
        { planId: { $regex: search, $options: "i" } }
      ];
    }

    // Status logic
    if (statusFilter && statusFilter !== 'all') {
      matchStage.status = statusFilter;
    }

    // DATE FILTER LOGIC
    if (startDateParam || endDateParam) {
      matchStage.startDate = {};
      if (startDateParam) {
        matchStage.startDate.$gte = new Date(startDateParam);
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999); // Ensure it includes the entire end day
        matchStage.startDate.$lte = end;
      }
    }

    const pipeline = [
      { $addFields: { convertedUserId: { $toObjectId: "$userId" } } },
      {
        $lookup: {
          from: "users",
          localField: "convertedUserId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      { $match: matchStage }, 
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            // SORTING HERE: -1 is Newest to Oldest
            { $sort: { startDate: -1, _id: -1 } }, 
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                plan: "$planId",
                price: "$amount",
                status: 1,
                startDate: 1,
                endDate: 1,
                userName: { 
                  $concat: [
                    { $ifNull: ["$userDetails.firstName", "Guest"] }, 
                    " ", 
                    { $ifNull: ["$userDetails.lastName", "User"] }
                  ] 
                },
                phoneNumber: { $ifNull: ["$userDetails.phoneNumber", "N/A"]},
                tradingviewUsername: { $ifNull: ["$userDetails.tradingviewUsername", "N/A"]}
              }
            }
          ],
          stats: [
            {
              $group: {
                _id: null,
                activeCount: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                expiredCount: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ];

    const result = await db.collection("subscriptions").aggregate(pipeline).toArray();
    
    const subscriptions = result[0].data || [];
    const totalCount = result[0].metadata[0]?.total || 0;
    const stats = result[0].stats[0] || { activeCount: 0, expiredCount: 0 };

    return NextResponse.json({ 
      subscriptions, 
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      activeCount: stats.activeCount,
      expiredCount: stats.expiredCount
    });

  } catch (error) {
    console.error("Sub API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
// import { getDatabase } from '@/lib/mongodb';
// import { NextResponse } from 'next/server';
// import { ObjectId } from 'mongodb'; // Import this to handle ID conversions

// export async function GET(req: Request) {
//   try {
//     const db = await getDatabase();
//     const { searchParams } = new URL(req.url);
    
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";
//     const statusFilter = searchParams.get("status"); // New: capture status
//     const skip = (page - 1) * limit;

//     // 1. Base Match Stage (Search)
//     const matchStage: any = search ? {
//       $or: [
//         { "userDetails.firstName": { $regex: search, $options: "i" } },
//         { "userDetails.lastName": { $regex: search, $options: "i" } },
//         { "userDetails.email": { $regex: search, $options: "i" } },
//         { planId: { $regex: search, $options: "i" } }
//       ]
//     } : {};

//     // 2. Status Filter Stage (Conditional)
//     if (statusFilter && statusFilter !== 'all') {
//       matchStage.status = statusFilter;
//     }

//     const pipeline = [
//       { $addFields: { convertedUserId: { $toObjectId: "$userId" } } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "convertedUserId",
//           foreignField: "_id",
//           as: "userDetails"
//         }
//       },
//       { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
//       { $match: matchStage }, // Filtered by Search AND Status
//       {
//         $facet: {
//           metadata: [{ $count: "total" }],
//           data: [
//             { $sort: { startDate: -1, _id: -1 } },
//             { $skip: skip },
//             { $limit: limit },
//             {
//               $project: {
//                 _id: 1,
//                 plan: "$planId",
//                 price: "$amount",
//                 status: 1,
//                 startDate: 1,
//                 endDate: 1,
//                 userName: { 
//                   $concat: [
//                     { $ifNull: ["$userDetails.firstName", "Guest"] }, 
//                     " ", 
//                     { $ifNull: ["$userDetails.lastName", "User"] }
//                   ] 
//                 },
//                 tradingviewUsername: { $ifNull: ["$userDetails.tradingviewUsername", "N/A"]},
//                 phoneNumber: { $ifNull: ["$userDetails.phoneNumber", "N/A"]}
//               }
//             }
//           ],
//           // New: Generate counts for the UI StatCards in the same query
//           stats: [
//             {
//               $group: {
//                 _id: null,
//                 activeCount: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
//                 expiredCount: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } }
//               }
//             }
//           ]
//         }
//       }
//     ];

//     const result = await db.collection("subscriptions").aggregate(pipeline).toArray();
    
//     const subscriptions = result[0].data;
//     const totalCount = result[0].metadata[0]?.total || 0;
//     const stats = result[0].stats[0] || { activeCount: 0, expiredCount: 0 };

//     return NextResponse.json({ 
//       subscriptions, 
//       totalPages: Math.ceil(totalCount / limit),
//       totalCount,
//       activeCount: stats.activeCount,
//       expiredCount: stats.expiredCount
//     });

//   } catch (error) {
//     console.error("Sub API Error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }

// export async function GETV1(req: Request) {
//   try {
//     const db = await getDatabase();
//     const { searchParams } = new URL(req.url);
    
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";
//     const skip = (page - 1) * limit;

//     // 1. Build the Match stage for searching
//     const matchStage = search ? {
//       $or: [
//         { "userDetails.firstName": { $regex: search, $options: "i" } },
//         { "userDetails.lastName": { $regex: search, $options: "i" } },
//         { "userDetails.email": { $regex: search, $options: "i" } },
//         { planId: { $regex: search, $options: "i" } }
//       ]
//     } : {};

//     // 2. The Aggregate Pipeline
//     const pipeline = [
//       // Step A: Convert userId string to ObjectId if necessary
//       {
//         $addFields: {
//           convertedUserId: { $toObjectId: "$userId" }
//         }
//       },
//       // Step B: Lookup User
//       {
//         $lookup: {
//           from: "users",
//           localField: "convertedUserId", // Match the converted field
//           foreignField: "_id",
//           as: "userDetails"
//         }
//       },
//       // Step C: Safe Unwind (keeps subscription even if user is missing)
//       { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      
//       // Step D: Apply the Search Filter
//       { $match: matchStage },

//       // Step E: Get Total Count and Data in one go using $facet
//       {
//         $facet: {
//           metadata: [{ $count: "total" }],
//           data: [
//             { $sort: { startDate: -1 } },
//             { $skip: skip },
//             { $limit: limit },
//             {
//               $project: {
//                 _id: 1,
//                 plan: "$planId",
//                 price: "$amount",
//                 status: 1,
//                 startDate: 1,
//                 endDate: 1,
//                 userName: { 
//                   $concat: [
//                     { $ifNull: ["$userDetails.firstName", "Guest"] }, 
//                     " ", 
//                     { $ifNull: ["$userDetails.lastName", "User"] }
//                   ] 
//                 },
//                 tradingviewUsername: { $ifNull: ["$userDetails.tradingviewUsername", "N/A"]}
//               }
//             }
//           ]
//         }
//       }
//     ];

//     const result = await db.collection("subscriptions").aggregate(pipeline).toArray();
    
//     const subscriptions = result[0].data;
//     const totalCount = result[0].metadata[0]?.total || 0;
//     const totalPages = Math.ceil(totalCount / limit);

//     return NextResponse.json({ 
//       subscriptions, 
//       totalPages,
//       totalCount 
//     });

//   } catch (error) {
//     console.error("Sub API Error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }
// import { verifyToken } from '@/lib/auth';
// import { getDatabase } from '@/lib/mongodb';
// import { NextResponse } from 'next/server';

// export async function GET(req: Request) {
//   try {
//     // const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     // const decoded = verifyToken(token!);

//     // if (!decoded || decoded.isAdmin !== true) {
//     //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     // }

//     const db = await getDatabase();

//     // Example snippet for the backend change
//     const { searchParams } = new URL(req.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const skip = (page - 1) * limit;

//     // Fetch subscriptions and join with user details to get the name
//     const subscriptions = await db.collection("subscriptions").aggregate([
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "userDetails"
//         }
//       },
//       { $unwind: "$userDetails" },
//       {
//         $project: {
//           _id: 1,
//           plan: "$planId", // Maps to your frontend interface
//           price: "$amount",
//           status: 1,
//           startDate: 1,
//           endDate: 1,
//           userName: { $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"] }
//         }
//       },
//       { $sort: { startDate: -1 } },
//       { $skip: skip },
//       { $limit: limit }
//     ]).toArray();

//     return NextResponse.json({ subscriptions });
//   } catch (error) {
//     console.error("Sub API Error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }