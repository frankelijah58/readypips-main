import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const videos = await db
      .collection("videos")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, url, thumbnail, category, duration } = body;

    if (!title || !url || !category) {
      return NextResponse.json(
        { error: "Title, URL, and category are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection("videos").insertOne({
      title,
      description: description || "",
      url,
      thumbnail: thumbnail || "",
      category,
      duration: duration || "",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      videoId: result.insertedId,
    });
  } catch (error: any) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    await db.collection("videos").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}