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

    // Fetch subscriptions and join with user details to get the name
    const subscriptions = await db.collection("subscriptions").aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          plan: "$planId", // Maps to your frontend interface
          price: "$amount",
          status: 1,
          startDate: 1,
          endDate: 1,
          userName: { $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"] }
        }
      },
      { $sort: { startDate: -1 } }
    ]).toArray();

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Sub API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}