import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyAdminToken } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminData = await verifyAdminToken(token);
    if (!adminData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDatabase();
    const paymentsCollection = db.collection('payment_intents');
    
    // Get latest payments grouped by user, showing paid users sorted by latest payment
    const paidUsers = await paymentsCollection
      .aggregate([
        {
          $match: {
            status: 'completed',
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: '$userId',
            latestPayment: { $first: '$$ROOT' },
            totalPaid: { $sum: { $toDouble: { $replaceAll: { input: { $toString: '$amount' }, find: /[^0-9.]/g, replacement: '' } } } },
            paymentCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $unwind: '$userInfo',
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
            email: '$userInfo.email',
            subscriptionType: '$userInfo.subscriptionType',
            latestPaymentDate: '$latestPayment.createdAt',
            latestPaymentAmount: '$latestPayment.amount',
            latestPlanName: '$latestPayment.planName',
            totalPaid: 1,
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

    // Map subscription types to display names
    const planTypeMap: { [key: string]: string } = {
      'free': 'Free Trial',
      'basic': 'Weekly',
      'premium': 'Monthly',
      'pro': '3 Months',
    };

    const formattedUsers = paidUsers.map((user: any) => {
      const subscriptionType = user.subscriptionType?.toLowerCase() || 'free';
      const planName = planTypeMap[subscriptionType] || user.latestPlanName || 'Unknown';

      return {
        userId: user.userId,
        userName: user.userName.trim() || 'Unknown User',
        email: user.email,
        currentPlan: planName,
        latestPaymentDate: user.latestPaymentDate,
        latestPaymentAmount: user.latestPaymentAmount,
        totalPaid: user.totalPaid.toFixed(2),
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
