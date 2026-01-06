import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

/**
 * GET /api/ai-insights/metrics
 * 
 * Retrieves telemetry metrics for AI Insights:
 * - Total analyses generated
 * - Parse successes and failures
 * - Average confidence scores
 * - Most analyzed symbols
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin-only access
    // const token = request.headers.get("authorization")?.split(" ")[1];
    // if (!isAdminToken(token)) return 401;

    const db = await getDatabase();
    const analyses = db.collection("analyses");

    // Get total count
    const totalCount = await analyses.countDocuments();

    // Analyze parse success/failure by checking if analysis contains 'raw' field
    const aggregation = await analyses
      .aggregate([
        {
          $project: {
            symbol: 1,
            createdAt: 1,
            analysis: 1,
            timeframe: 1,
            publicId: 1,
            metadata: 1,
          },
        },
        {
          $facet: {
            allAnalyses: [{ $limit: 1000 }],
            symbolStats: [
              {
                $group: {
                  _id: "$symbol",
                  count: { $sum: 1 },
                  avgDate: { $max: "$createdAt" },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            timeframeStats: [
              {
                $group: {
                  _id: "$timeframe",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
            ],
          },
        },
      ])
      .toArray();

    const [stats] = aggregation;

    // Analyze raw text vs parsed JSON
    let parseSuccesses = 0;
    let parseFailures = 0;
    let avgConfidence = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    for (const item of stats.allAnalyses) {
      try {
        const analysis = JSON.parse(item.analysis);
        
        // Check if this is raw-only (fallback) or properly parsed
        if (analysis.raw && !analysis.meta) {
          parseFailures++;
        } else {
          parseSuccesses++;
        }

        // Extract confidence score if available
        if (analysis.meta?.analysis_confidence_score) {
          confidenceSum += parseInt(analysis.meta.analysis_confidence_score);
          confidenceCount++;
        }
      } catch (e) {
        parseFailures++;
      }
    }

    if (confidenceCount > 0) {
      avgConfidence = confidenceSum / confidenceCount;
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      totalAnalyses: totalCount,
      parseMetrics: {
        successes: parseSuccesses,
        failures: parseFailures,
        successRate: totalCount > 0 ? ((parseSuccesses / totalCount) * 100).toFixed(2) + "%" : "N/A",
      },
      confidence: {
        average: avgConfidence.toFixed(2),
        sampledFrom: confidenceCount,
      },
      topSymbols: stats.symbolStats || [],
      strategiesUsed: stats.timeframeStats || [],
      status: parseFailures === 0 ? "✅ Healthy" : `⚠️ ${parseFailures} parse failures detected`,
    };

    // console.log("📊 [AI Metrics] Retrieved AI Insights metrics:", metrics);

    return NextResponse.json(metrics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error retrieving AI metrics:", errorMessage);
    return NextResponse.json(
      { error: "Failed to retrieve metrics", details: errorMessage },
      { status: 500 }
    );
  }
}
