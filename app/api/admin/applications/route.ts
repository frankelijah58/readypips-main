import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch applications based on status tab
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);
    if (!decoded || !decoded.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'pending' or 'approved'

    const db = await getDatabase();

    // Build query based on status tab
    const query: any = {
      role: { $in: ["partner", "affiliate"] }
    };

    if (status === "approved") {
      query.$or = [
        { "partnerProfile.isApproved": true },
        { "affiliateProfile.isActive": true }
      ];
    } else if (status === "pending") {
      query.$or = [
        { "partnerProfile.isApproved": false },
        { "affiliateProfile.isActive": false },
        { "partnerProfile.isApproved": { $exists: false }, role: "partner" },
        { "affiliateProfile.isActive": { $exists: false }, role: "affiliate" }
      ];
    }

    const applications = await db.collection("users")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(applications);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// PATCH: Update rates, tiers, profile details, and approval status
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token!);
    if (!decoded || !decoded.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { userId, status, updates, role } = await req.json();
    const db = await getDatabase();

    const updateQuery: any = {};
    
    if (role === 'partner') {
      // Approval Status
      if (status) updateQuery["partnerProfile.isApproved"] = status === 'approved';
      
      // Financials & Tiering
      if (updates.revenueShare) updateQuery["partnerProfile.revenueShare"] = parseFloat(updates.revenueShare);
      if (updates.tier) updateQuery["partnerProfile.tier"] = updates.tier;
      
      // New Detailed Metadata
      if (updates.companyName) updateQuery["partnerProfile.companyName"] = updates.companyName;
      if (updates.website) updateQuery["partnerProfile.website"] = updates.website;
      if (updates.location) updateQuery["partnerProfile.location"] = updates.location;
      
    } else if (role === 'affiliate') {
      // Approval Status
      if (status) updateQuery["affiliateProfile.isActive"] = status === 'approved';
      
      // Financials
      if (updates.commissionRate) updateQuery["affiliateProfile.commissionRate"] = parseFloat(updates.commissionRate);
      
      // New Detailed Metadata
      if (updates.source) updateQuery["affiliateProfile.source"] = updates.source;
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateQuery }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
// import { verifyToken } from '@/lib/auth';
// import { getDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';
// import { NextRequest, NextResponse } from 'next/server';

// // GET: Fetch all pending or active affiliates/partners
// export async function GET(req: NextRequest) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token!);
//     if (!decoded || !decoded.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

//     const db = await getDatabase();
//     const applications = await db.collection("users").find({
//       role: { $in: ["partner", "affiliate"] }
//     }).toArray();

//     return NextResponse.json(applications);
//   } catch (error) {
//     return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
//   }
// }

// // PATCH: Update rates, tiers, and approval status
// export async function PATCH(req: NextRequest) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     const decoded = verifyToken(token!);
//     if (!decoded || !decoded.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

//     const { userId, status, updates, role } = await req.json();
//     const db = await getDatabase();

//     const updateQuery: any = {};
    
//     if (role === 'partner') {
//       if (status) updateQuery["partnerProfile.isApproved"] = status === 'approved';
//       if (updates.revenueShare) updateQuery["partnerProfile.revenueShare"] = parseFloat(updates.revenueShare);
//       if (updates.tier) updateQuery["partnerProfile.tier"] = updates.tier;
//     } else {
//       if (status) updateQuery["affiliateProfile.isActive"] = status === 'approved';
//       if (updates.commissionRate) updateQuery["affiliateProfile.commissionRate"] = parseFloat(updates.commissionRate);
//     }

//     await db.collection("users").updateOne(
//       { _id: new ObjectId(userId) },
//       { $set: updateQuery }
//     );

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json({ error: "Update failed" }, { status: 500 });
//   }
// }