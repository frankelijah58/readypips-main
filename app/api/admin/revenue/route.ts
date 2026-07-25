import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDatabase();
    const { ObjectId } = require('mongodb');
    
    // Verify admin has permission
    const adminUser = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    });

    if (!adminUser || (!adminUser.isAdmin && adminUser.role !== 'admin' && adminUser.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all completed payments
    const completedPayments = await db.collection("payments").find({
      status: "completed"
    }).toArray();

    // Calculate total revenue in KES
    const totalRevenue = completedPayments.reduce((sum: number, payment: any) => {
      // Extract numeric value from amount (handle both number and string with currency)
      let amount = 0;
      if (typeof payment.amount === 'number') {
        amount = payment.amount;
      } else if (typeof payment.amount === 'string') {
        amount = parseFloat(payment.amount.replace(/[^0-9.]/g, '') || '0');
      }
      
      // If amount is in USD, convert to KES (assuming 1 USD = ~150 KES)
      // You can update this conversion rate as needed
      if (payment.currency === 'USD') {
        amount = amount * 150;
      }
      
      return sum + amount;
    }, 0);

    // Calculate weekly revenue (last 7 days) in KES
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyPayments = await db.collection("payments").find({
      status: "completed",
      createdAt: { $gte: weekAgo }
    }).toArray();
    
    const weeklyRevenue = weeklyPayments.reduce((sum: number, payment: any) => {
      let amount = 0;
      if (typeof payment.amount === 'number') {
        amount = payment.amount;
      } else if (typeof payment.amount === 'string') {
        amount = parseFloat(payment.amount.replace(/[^0-9.]/g, '') || '0');
      }
      
      if (payment.currency === 'USD') {
        amount = amount * 150;
      }
      
      return sum + amount;
    }, 0);

    // Calculate monthly revenue (last 30 days) in KES
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyPayments = await db.collection("payments").find({
      status: "completed",
      createdAt: { $gte: monthAgo }
    }).toArray();
    
    const monthlyRevenue = monthlyPayments.reduce((sum: number, payment: any) => {
      let amount = 0;
      if (typeof payment.amount === 'number') {
        amount = payment.amount;
      } else if (typeof payment.amount === 'string') {
        amount = parseFloat(payment.amount.replace(/[^0-9.]/g, '') || '0');
      }
      
      if (payment.currency === 'USD') {
        amount = amount * 150;
      }
      
      return sum + amount;
    }, 0);

    // Calculate daily revenue (last 24 hours) in KES
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyPayments = await db.collection("payments").find({
      status: "completed",
      createdAt: { $gte: dayAgo }
    }).toArray();
    
    const dailyRevenue = dailyPayments.reduce((sum: number, payment: any) => {
      let amount = 0;
      if (typeof payment.amount === 'number') {
        amount = payment.amount;
      } else if (typeof payment.amount === 'string') {
        amount = parseFloat(payment.amount.replace(/[^0-9.]/g, '') || '0');
      }
      
      if (payment.currency === 'USD') {
        amount = amount * 150;
      }
      
      return sum + amount;
    }, 0);

    // Get revenue breakdown by plan type
    const revenueByPlan = await db.collection("payments").aggregate([
      {
        $match: {
          status: "completed"
        }
      },
      {
        $group: {
          _id: "$planId",
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $isNumber: "$amount" },
                "$amount",
                { $toDouble: { $replaceAll: { input: { $toString: "$amount" }, find: "KES ", replacement: "" } } }
              ]
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]).toArray();

    // Calculate revenue by subscription status
    const activeSubscriptions = await db.collection("subscriptions").find({
      status: { $in: ["active", "trial"] }
    }).toArray();
    
    const activeRevenue = activeSubscriptions.reduce((sum: number, sub: any) => {
      return sum + (sub.price || 0);
    }, 0);

    return NextResponse.json({
      revenue: {
        total: parseFloat(totalRevenue.toFixed(2)),
        weekly: parseFloat(weeklyRevenue.toFixed(2)),
        monthly: parseFloat(monthlyRevenue.toFixed(2)),
        daily: parseFloat(dailyRevenue.toFixed(2)),
        active: parseFloat(activeRevenue.toFixed(2)),
        currency: "KES",
        byPlan: revenueByPlan,
        totalPayments: completedPayments.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching revenue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
