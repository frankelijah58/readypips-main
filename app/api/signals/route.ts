import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { SignalService } from "@/lib/signal-service";

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const signalsCollection = db.collection("signals");

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const pair = searchParams.get("pair"); // Support 'pair' parameter too
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query - signals collection uses 'symbol' field
    const query: any = { isActive: true };
    // Support both 'symbol' and 'pair' parameters (both map to 'symbol' field)
    if (symbol) query.symbol = symbol;
    if (pair) query.symbol = pair; // Map 'pair' param to 'symbol' field
    if (type) query.type = type;

    // Get signals from database
    const signals = await signalsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // If no signals in database, generate some using the real service
    if (signals.length === 0) {
      // console.log("No signals in database, generating new ones...");
      const signalService = SignalService.getInstance();
      await signalService.generateAndSaveSignals();

      // Fetch the newly generated signals
      const newSignals = await signalsCollection
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      // Return in format expected by live-chart component
      return NextResponse.json({ signals: newSignals });
    }

    // Return in format expected by live-chart component
    return NextResponse.json({ signals: signals });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const signalService = SignalService.getInstance();
    await signalService.generateAndSaveSignals();

    return NextResponse.json({ message: "Signals generated successfully" });
  } catch (error) {
    console.error("Error generating signals:", error);
    return NextResponse.json(
      { error: "Failed to generate signals" },
      { status: 500 }
    );
  }
}
