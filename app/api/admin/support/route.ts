import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { verifyToken, findUserById } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  const decoded = verifyToken(token);
  if (!decoded?.userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  const user = await findUserById(decoded.userId);
  if (!user || (!user.isAdmin && user.role !== "admin")) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

/**
 * Read-only list of support tickets for admins.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const search = (searchParams.get("search") || "").trim();
    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { ticketNumber: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { queryTypeLabel: { $regex: search, $options: "i" } },
      ];
    }

    const [rawItems, totalCount] = await Promise.all([
      db
        .collection("support_requests")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .project({
          ticketNumber: 1,
          name: 1,
          email: 1,
          phoneNumber: 1,
          queryType: 1,
          queryTypeLabel: 1,
          description: 1,
          status: 1,
          staffEmailSent: 1,
          userEmailSent: 1,
          emailError: 1,
          createdAt: 1,
        })
        .toArray(),
      db.collection("support_requests").countDocuments(filter),
    ]);

    const items = rawItems.map((r) => ({
      ...r,
      _id: String(r._id),
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      requests: items,
      page,
      limit,
      totalCount,
      totalPages,
    });
  } catch (e) {
    console.error("admin support GET:", e);
    return NextResponse.json({ error: "Failed to load support requests" }, { status: 500 });
  }
}
