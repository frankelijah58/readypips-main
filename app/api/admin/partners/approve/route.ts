import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });
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
      "partnerProfile.isApproved": true
    }).sort({ "partnerProfile.appliedAt": -1 }).toArray();

    // console.log("Pending Partners:", pendingPartners);
    return NextResponse.json({ partners: pendingPartners });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    // const decoded = verifyToken(token!);

    // if (!decoded || decoded?.role !== 'admin') {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { userId } = await req.json();
    const db = await getDatabase();

    // 1. Update User Status
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { 
        "partnerProfile.isApproved": true,
        "partnerProfile.approvedAt": new Date(),
        updatedAt: new Date(),
       },
     },
      { returnDocument: 'after' }
    );

    const user = result?.value || result; // Handle different Mongo driver versions

    // 2. Send Onboarding Email
    // if (user) {
    //   await transporter.sendMail({
    //     from: `"Partnership Team" <${process.env.EMAIL_USER}>`,
    //     to: user.email,
    //     subject: "Welcome to the Partner Program! 🚀",
    //     html: `
    //       <h1>Congratulations ${user.firstName}!</h1>
    //       <p>Your application has been approved. You can now access your partner dashboard and start using your referral code: <strong>${user.partnerProfile.referralCode}</strong></p>
    //       <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/partner">Go to Dashboard</a>
    //     `,
    //   });
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to approve partner" }, { status: 500 });
  }
}
// import { NextResponse } from "next/server";
// import { getDatabase } from "@/lib/mongodb";
// import { ObjectId } from "mongodb";
// import { requireAdmin } from "@/lib/adminAuth";

// export async function POST(req: Request) {
//   try {
//     await requireAdmin(req);
//     const { userId } = await req.json();

//     if (!userId) {
//       return NextResponse.json(
//         { error: "User ID required" },
//         { status: 400 }
//       );
//     }

//     const db = await getDatabase();

//     await db.collection("users").updateOne(
//       { _id: new ObjectId(userId) },
//       {
//         $set: {
//           "partnerProfile.isApproved": true,
          // "partnerProfile.approvedAt": new Date(),
          // updatedAt: new Date(),
//         },
//       }
//     );

//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: err.message || "Approval failed" },
//       { status: 500 }
//     );
//   }
// }
