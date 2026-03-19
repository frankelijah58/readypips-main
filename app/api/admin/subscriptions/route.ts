import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const skip = (page - 1) * limit;

    const matchStage: any = {};

    if (search) {
      matchStage.$or = [
        { 'userDetails.firstName': { $regex: search, $options: 'i' } },
        { 'userDetails.lastName': { $regex: search, $options: 'i' } },
        { 'userDetails.email': { $regex: search, $options: 'i' } },
        { planId: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } },
      ];
    }

    if (statusFilter && statusFilter !== 'all') {
      matchStage.status = statusFilter;
    }

    if (startDateParam || endDateParam) {
      matchStage.updatedAt = {};
      if (startDateParam) {
        matchStage.updatedAt.$gte = new Date(startDateParam);
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        matchStage.updatedAt.$lte = end;
      }
    }

    const pipeline = [
      { $addFields: { convertedUserId: { $toObjectId: '$userId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'convertedUserId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
      { $match: matchStage },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { updatedAt: -1, _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                plan: '$planId',
                price: '$amount',
                provider: 1,
                status: 1,
                startDate: 1,
                endDate: 1,
                updatedDate: '$updatedAt',
                userName: {
                  $concat: [
                    { $ifNull: ['$userDetails.firstName', 'Guest'] },
                    ' ',
                    { $ifNull: ['$userDetails.lastName', 'User'] },
                  ],
                },
                email: { $ifNull: ['$userDetails.email', 'N/A'] },
                phoneNumber: { $ifNull: ['$userDetails.phoneNumber', 'N/A'] },
                tradingviewUsername: {
                  $ifNull: ['$userDetails.tradingviewUsername', 'N/A'],
                },
              },
            },
          ],
          stats: [
            {
              $group: {
                _id: null,
                activeCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                },
                expiredCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ];

    const result = await db.collection('subscriptions').aggregate(pipeline).toArray();

    const subscriptions = result[0].data || [];
    const totalCount = result[0].metadata[0]?.total || 0;
    const stats = result[0].stats[0] || { activeCount: 0, expiredCount: 0 };

    return NextResponse.json({
      subscriptions,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      activeCount: stats.activeCount,
      expiredCount: stats.expiredCount,
    });
  } catch (error) {
    console.error('Sub API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}