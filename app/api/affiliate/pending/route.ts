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

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const decoded = verifyToken(token!);

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform, audienceSize, strategy } = await req.json();
  const db = await getDatabase();

  const referralCode = `rp-${decoded.userId.slice(-6)}`;

  await db.collection("users").updateOne(
    { _id: new ObjectId(decoded.userId) },
    {
      $set: {
        role: "partner",
        partnerProfile: {
          platform,
          audienceSize,
          strategy,
          isApproved: false,
          referralCode,
          appliedAt: new Date(),
        },
      },
    }
  );

  return NextResponse.json({ success: true });
}

