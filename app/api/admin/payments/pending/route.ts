import { verifyToken } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    // const decoded = verifyToken(token!);

    // if (!decoded || decoded.role !== 'admin') {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const db = await getDatabase();

    // Fetch pending intents and join with users to see who they are
    const pending = await db.collection("payment_intents").aggregate([
      { $match: { status: "pending" } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          reference: 1,
          planId: 1,
          provider: 1,
          amount: 1,
          createdAt: 1,
          email: 1,
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 } // Show only the 20 most recent attempts
    ]).toArray();

    return NextResponse.json({ pending });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}