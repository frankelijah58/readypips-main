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

// /api/partner/apply/route.ts
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { platform, audienceSize, strategy } = await req.json();
    const db = await getDatabase();

    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          role: "affiliate", // Upgraded from 'user'
          affiliateProfile: {
            referralCode: `aff-${decoded.userId.slice(-6)}`,
            commissionRate: 0.10, // Standard 10%
            totalEarnings: 0,
            totalReferrals: 0,
            isActive: false, // Wait for admin
            appliedAt: new Date(),
            applicationDetails: { platform, audienceSize, strategy }
          },
        },
      }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Application failed" }, { status: 500 });
  }
}
