import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyAdminToken } from '@/lib/admin';
import {
  PAID_INTENT_STATUSES,
  addAmountKesFieldStage,
  usdToKesRate,
} from '@/lib/dashboard-revenue';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminData = await verifyAdminToken(token);
    if (!adminData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDatabase();
    const rate = usdToKesRate();

    const paidUsers = await db
      .collection('payment_intents')
      .aggregate([
        {
          $match: {
            status: { $in: [...PAID_INTENT_STATUSES] },
          },
        },
        addAmountKesFieldStage(rate),
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: '$userId',
            latestPayment: { $first: '$$ROOT' },
            totalPaidKes: { $sum: '$amountKes' },
            paymentCount: { $sum: 1 },
          },
        },
        {
          $addFields: {
            userOid: {
              $convert: {
                input: '$_id',
                to: 'objectId',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userOid',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            userId: '$_id',
            userName: {
              $concat: [
                { $ifNull: ['$userInfo.firstName', ''] },
                ' ',
                { $ifNull: ['$userInfo.lastName', ''] },
              ],
            },
            email: { $ifNull: ['$userInfo.email', '$latestPayment.email'] },
            subscriptionType: '$userInfo.subscriptionType',
            latestPaymentDate: {
              $ifNull: ['$latestPayment.paidAt', '$latestPayment.createdAt'],
            },
            latestPaymentAmount: '$latestPayment.amountKes',
            latestPlanName: {
              $ifNull: ['$latestPayment.planName', '$latestPayment.planId'],
            },
            totalPaid: '$totalPaidKes',
            paymentCount: 1,
          },
        },
        {
          $sort: { latestPaymentDate: -1 },
        },
        {
          $limit: 20,
        },
      ])
      .toArray();

    const planTypeMap: Record<string, string> = {
      free: 'Free Trial',
      basic: 'Weekly',
      weekly: 'Weekly',
      premium: 'Monthly',
      monthly: 'Monthly',
      pro: '3 Months',
      '3months': '3 Months',
      lifetime: 'Lifetime',
    };

    const formattedUsers = paidUsers.map((user: any) => {
      const subscriptionType = String(user.subscriptionType || '').toLowerCase();
      const planName =
        planTypeMap[subscriptionType] || user.latestPlanName || 'Unknown';

      return {
        userId: user.userId,
        userName: String(user.userName || '').trim() || 'Unknown User',
        email: user.email || 'Unknown',
        currentPlan: planName,
        latestPaymentDate: user.latestPaymentDate,
        latestPaymentAmount: Number(user.latestPaymentAmount || 0),
        totalPaid: Number(user.totalPaid || 0).toFixed(2),
        paymentCount: user.paymentCount,
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching paid users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paid users' },
      { status: 500 }
    );
  }
}
