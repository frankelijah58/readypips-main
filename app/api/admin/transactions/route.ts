import { getDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "15", 10), 1);
    const search = String(searchParams.get("search") || "").trim();
    const skip = (page - 1) * limit;

    const db = await getDatabase();

    const match: Record<string, any> = {};
    if (search) {
      match.$or = [
        { email: { $regex: search, $options: "i" } },
        { planId: { $regex: search, $options: "i" } },
        { provider: { $regex: search, $options: "i" } },
        { paymentChannel: { $regex: search, $options: "i" } },
      ];
    }

    const result = await db
      .collection("payment_intents")
      .aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  email: 1,
                  planId: 1,
                  provider: 1,
                  paymentChannel: 1,
                  status: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const payments = result[0]?.data ?? [];
    const totalCount = result[0]?.metadata?.[0]?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

    return NextResponse.json({
      payments,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Transactions API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
