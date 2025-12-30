import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function GET(req: NextRequest) {
  const decoded = verifyToken(req.headers.get("authorization")?.replace("Bearer ", "")!);
  const db = await getDatabase();

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnerId = new ObjectId(decoded.userId);

  const referrals = await db.collection("referrals").find({ partnerId }).toArray();

  const totalRevenue = referrals.reduce((sum, r) => sum + r.revenue, 0);

  return NextResponse.json({
    referralCode: `https://readypips.com/ref/${decoded.userId}`,
    stats: {
      totalRevenue,
      activeReferrals: referrals.length,
      conversionRate: referrals.length ? "3.2%" : "0%",
    },
    revenueChart: aggregateByDay(referrals),
    recentConversions: referrals.slice(-5),
  });
}


function aggregateByDay(referrals: any[]) {
  const dailyData: { [key: string]: number } = {};

  referrals.forEach((referral) => {
    const dateKey = new Date(referral.date).toISOString().split('T')[0];
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = 0;
    }
    dailyData[dateKey] += referral.revenue;
  });

  const result = Object.keys(dailyData).map((date) => ({
    date,
    revenue: dailyData[date],
  }));

  return result;
}