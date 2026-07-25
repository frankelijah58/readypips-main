// api/admin/subscriptions/bulk/route.ts
import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PATCH(req: Request) {
  try {
    const db = await getDatabase();
    const { ids, status, extendDays } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No subscriptions selected" }, { status: 400 });
    }

    const objectIds = ids.map(id => new ObjectId(id));
    let updateDoc: any = {};

    if (status) {
      updateDoc.$set = { status };
    }

    // If extending, we use $inc to add milliseconds to the current endDate
    if (extendDays) {
      const msToAdd = extendDays * 24 * 60 * 60 * 1000;
      updateDoc.$inc = { endDate: msToAdd }; 
    }

    const result = await db.collection("subscriptions").updateMany(
      { _id: { $in: objectIds } },
      updateDoc
    );

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${result.modifiedCount} subscriptions` 
    });
  } catch (error) {
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
}