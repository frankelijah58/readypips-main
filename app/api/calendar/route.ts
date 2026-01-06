import { NextRequest, NextResponse } from "next/server";
import { NewsService } from "@/lib/news-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const refresh = searchParams.get("refresh") === "true";

    const newsService = NewsService.getInstance();

    if (refresh) {
      // Fetch fresh economic events from external APIs
      // console.log("📅 Fetching fresh economic calendar...");
      const freshEvents = await newsService.fetchEconomicCalendar();
      await newsService.saveEconomicEventsToDatabase(freshEvents);
      
      return NextResponse.json(freshEvents);
    }

    // Get events from database
    const events = await newsService.getEconomicEventsFromDatabase(limit);

    // If no events in database, fetch fresh events
    if (events.length === 0) {
      // console.log("📅 No economic events in database, fetching fresh events...");
      const freshEvents = await newsService.fetchEconomicCalendar();
      await newsService.saveEconomicEventsToDatabase(freshEvents);
      
      return NextResponse.json(freshEvents);
    }

    // Filter by category if specified
    if (category) {
      const filteredEvents = events.filter(event => event.category === category);
      return NextResponse.json(filteredEvents);
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching economic calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch economic calendar" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventId, actual } = await request.json();
    
    if (!eventId || !actual) {
      return NextResponse.json(
        { error: "Event ID and actual value are required" },
        { status: 400 }
      );
    }

    const newsService = NewsService.getInstance();
    await newsService.updateEconomicEventResult(eventId, actual);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating economic event result:", error);
    return NextResponse.json(
      { error: "Failed to update economic event result" },
      { status: 500 }
    );
  }
} 