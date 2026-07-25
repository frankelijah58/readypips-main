import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PATCH(req: Request) {
  try {
    const db = await getDatabase();
    const body = await req.json();
    const { subscriptionId, endDate, status } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing Subscription ID" }, { status: 400 });
    }

    // Build the update object dynamically based on what's provided
    const updateData: any = {};
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status;

    const result = await db.collection("subscriptions").updateOne(
      { _id: new ObjectId(subscriptionId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Subscription updated successfully" 
    });

  } catch (error) {
    console.error("Update Sub Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}