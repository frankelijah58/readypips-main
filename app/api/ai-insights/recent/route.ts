import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/ai-insights/recent?limit=10&includeRaw=false
 * 
 * Retrieves recent AI analyses for admin viewing.
 * ?limit=10 - number of recent records (default 10, max 100)
 * ?includeRaw=true - include full raw analysis text (useful for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitStr = searchParams.get("limit") || "10";
    const includeRaw = searchParams.get("includeRaw") === "true";

    const limit = Math.min(parseInt(limitStr), 100); // Cap at 100

    const db = await getDatabase();
    const analyses = db.collection("analyses");

    // Fetch recent analyses
    const recent = await analyses
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Parse analysis JSON and extract key info
    const formatted = recent.map((doc: any) => {
      let parsed: any = {};
      let hasRaw = false;

      try {
        parsed = JSON.parse(doc.analysis);
        hasRaw = parsed.raw && !parsed.meta; // Raw-only fallback
      } catch (e) {
        parsed = { parseError: String(e) };
        hasRaw = true;
      }

      // Extract key fields for summary
      const summary: Record<string, any> = {
        _id: doc._id.toString(),
        publicId: doc.publicId,
        symbol: doc.symbol,
        timeframe: doc.timeframe,
        createdAt: doc.createdAt,
        parseStatus: hasRaw ? "⚠️ Raw-only (fallback)" : "✅ Parsed JSON",
        confidenceScore: parsed.meta?.analysis_confidence_score || "N/A",
        direction: parsed.simulation_strategy?.direction || "N/A",
        entryPrice: parsed.simulation_strategy?.theoretical_entry?.price || "N/A",
      };

      // Include full analysis if requested
      if (includeRaw) {
        summary.fullAnalysis = doc.analysis.substring(0, 500) + (doc.analysis.length > 500 ? "..." : "");
      }

      return summary;
    });

    // console.log(`📊 [AI Recent] Retrieved ${formatted.length} recent analyses`);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      count: formatted.length,
      analyses: formatted,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error retrieving recent analyses:", errorMessage);
    return NextResponse.json(
      { error: "Failed to retrieve analyses", details: errorMessage },
      { status: 500 }
    );
  }
}
