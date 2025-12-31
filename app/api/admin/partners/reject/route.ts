
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";


export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    // const decoded = verifyToken(token!);

    // if (!decoded || decoded.role !== 'admin') {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { userId } = await req.json();
    const db = await getDatabase();

    // Fetch user before modification to get email
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    // Option: Reset role to 'user' and remove partner data
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { role: "user" },
        $unset: { partnerProfile: "" } 
      }
    );

    // Notify the user gently
    // if (user) {
    //   await transporter.sendMail({
    //     from: `"Partnership Team" <${process.env.EMAIL_USER}>`,
    //     to: user.email,
    //     subject: "Update regarding your Partner Application",
    //     text: `Hi ${user.firstName}, thank you for your interest. At this time, we are unable to move forward with your partnership application. Feel free to apply again in the future.`,
    //   });
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

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
//           role: "user",
//           updatedAt: new Date(),
//         },
//         $unset: {
//           partnerProfile: "",
//         },
//       }
//     );

//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: err.message || "Rejection failed" },
//       { status: 500 }
//     );
//   }
// }
