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
    const providerFilter = String(searchParams.get("provider") || "all").toLowerCase();
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    // 1. Build Match Stage
    const matchStage: any = {};
    const andConditions: any[] = [];

    // Search logic
    if (search) {
      andConditions.push({
        $or: [
        { "userDetails.firstName": { $regex: search, $options: "i" } },
        { "userDetails.lastName": { $regex: search, $options: "i" } },
        { "userDetails.email": { $regex: search, $options: "i" } },
        { planId: { $regex: search, $options: "i" } }
      ]});
    }

    // Status logic
    if (statusFilter && statusFilter !== 'all') {
      matchStage.status = statusFilter;
    }

    // Provider/channel logic
    if (providerFilter && providerFilter !== "all") {
      if (providerFilter === "card") {
        andConditions.push({
          $or: [
          { paymentChannel: "card" },
          { provider: { $in: ["whop", "stripe", "paystack", "pesapal", "card"] } },
        ]});
      } else if (providerFilter === "mpesa" || providerFilter === "binance") {
        andConditions.push({
          $or: [
          { paymentChannel: providerFilter },
          { provider: providerFilter },
        ]});
      }
    }

    // DATE FILTER LOGIC
    // if (startDateParam || endDateParam) {
    //   matchStage.startDate = {};
    //   if (startDateParam) {
    //     matchStage.startDate.$gte = new Date(startDateParam);
    //   }
    //   if (endDateParam) {
    //     const end = new Date(endDateParam);
    //     end.setHours(23, 59, 59, 999); // Ensure it includes the entire end day
    //     matchStage.startDate.$lte = end;
    //   }
    // }
    // 1. Update the Date Filter Logic to use updatedAt instead of startDate
    if (startDateParam || endDateParam) {
      matchStage.updatedAt = {}; // Change from startDate to updatedAt
      if (startDateParam) {
        matchStage.updatedAt.$gte = new Date(startDateParam);
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999); // Ensure it includes the entire end day
        matchStage.updatedAt.$lte = end;
      }
    }
    if (andConditions.length) {
      matchStage.$and = andConditions;
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
            // { $sort: { startDate: -1, _id: -1 } }, 
            { $sort: { updatedAt: -1, _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                plan: "$planId",
                price: "$amount",
                priceKes: {
                  $cond: [
                    { $gt: [{ $ifNull: ["$amountKes", 0] }, 0] },
                    "$amountKes",
                    {
                      $cond: [
                        { $eq: [{ $toUpper: { $ifNull: ["$currency", ""] } }, "KES"] },
                        "$amount",
                        null,
                      ],
                    },
                  ],
                },
                priceUsd: {
                  $cond: [
                    { $gt: [{ $ifNull: ["$amountUsd", 0] }, 0] },
                    "$amountUsd",
                    {
                      $cond: [
                        { $eq: [{ $toUpper: { $ifNull: ["$currency", ""] } }, "USD"] },
                        "$amount",
                        null,
                      ],
                    },
                  ],
                },
                currency: { $ifNull: ["$currency", null] },
                fxRateKesToUsd: { $ifNull: ["$fxRateKesToUsd", null] },
                fxSource: { $ifNull: ["$fxSource", null] },
                fxFetchedAt: { $ifNull: ["$fxFetchedAt", null] },
                provider: { $ifNull: ["$provider", null] },
                paymentChannel: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $in: [
                            { $toLower: { $ifNull: ["$paymentChannel", ""] } },
                            ["mpesa", "binance", "card"],
                          ],
                        },
                        then: { $toLower: "$paymentChannel" },
                      },
                      {
                        case: { $eq: [{ $toLower: { $ifNull: ["$provider", ""] } }, "mpesa"] },
                        then: "mpesa",
                      },
                      {
                        case: { $eq: [{ $toLower: { $ifNull: ["$provider", ""] } }, "binance"] },
                        then: "binance",
                      },
                      {
                        case: {
                          $in: [
                            { $toLower: { $ifNull: ["$provider", ""] } },
                            ["whop", "stripe", "paystack", "pesapal", "card"],
                          ],
                        },
                        then: "card",
                      },
                    ],
                    default: "card",
                  },
                },
                status: 1,
                startDate: 1,
                endDate: 1,
                updatedDate: "$updatedAt",
                userName: { 
                  $concat: [
                    { $ifNull: ["$userDetails.firstName", "Guest"] }, 
                    " ", 
                    { $ifNull: ["$userDetails.lastName", "User"] }
                  ] 
                },
                email: { $ifNull: ["$userDetails.email", "N/A"]},
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
