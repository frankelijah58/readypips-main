import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);

    if (!decoded || decoded.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    // Get the start of the current month for the "This Month" stat
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Run queries in parallel for maximum performance
    const [
      totalPartners,
      pendingCount,
      approvedCount,
      approvedThisMonth,
      uniqueCountries
    ] = await Promise.all([
      db.collection("users").countDocuments({ role: "partner" }),
      db.collection("users").countDocuments({ role: "partner", "partnerProfile.isApproved": false }),
      db.collection("users").countDocuments({ role: "partner", "partnerProfile.isApproved": true }),
      db.collection("users").countDocuments({ 
        role: "partner", 
        "partnerProfile.isApproved": true,
        "partnerProfile.appliedAt": { $gte: startOfMonth } // Or track an "approvedAt" field
      }),
      db.collection("users").distinct("partnerProfile.country", { role: "partner" })
    ]);

    return NextResponse.json({
      stats: {
        total: totalPartners,
        pending: pendingCount,
        approved: approvedCount,
        approvedThisMonth: approvedThisMonth,
        countryCount: uniqueCountries.length
      }
    });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}