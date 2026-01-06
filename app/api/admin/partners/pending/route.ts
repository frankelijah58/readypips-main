import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);

    // Security Guard: Ensure only Admins can access this list
    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Find users who have a partner role but are NOT yet approved
    const pendingPartners = await db.collection("users").find({
      role: "partner",
      "partnerProfile.isApproved": false
    }).sort({ "partnerProfile.appliedAt": -1 }).toArray();

    // console.log("Pending Partners:", pendingPartners);
    return NextResponse.json({ partners: pendingPartners });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}