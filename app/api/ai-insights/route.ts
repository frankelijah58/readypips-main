import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

interface TechnicalIndicators {
  sma_20: number;
  sma_50: number;
  ema_12: number;
  ema_26: number;
  rsi: number;
  macd: number;
  macd_signal: number;
  bollinger_upper: number;
  bollinger_lower: number;
  bollinger_middle: number;
}

interface AnalysisRequest {
  symbol: string;
  marketData: MarketData;
  primaryIndicators: TechnicalIndicators;
  allBarsData: { [timeframe: string]: any[] };
  allIndicators: { [timeframe: string]: TechnicalIndicators };
  timeframes: string[];
  primaryTimeframe: string;
  analysisContext: {
    strategy: string;
    strategyDescription: string;
    selectedTimeframes: string[];
  };
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Token estimation (rough calculation)
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

function calculateConfidenceScore(
  indicators: TechnicalIndicators,
  marketData: MarketData
): number {
  let confidence = 50; // Base confidence

  // RSI analysis (0-100 scale)
  if (indicators.rsi < 30 || indicators.rsi > 70) {
    confidence += 10; // Strong oversold/overbought signals
  } else if (indicators.rsi < 40 || indicators.rsi > 60) {
    confidence += 5; // Moderate signals
  }

  // MACD analysis
  const macdDiff = indicators.macd - indicators.macd_signal;
  if (Math.abs(macdDiff) > 2) {
    confidence += 8; // Strong MACD divergence
  } else if (Math.abs(macdDiff) > 1) {
    confidence += 4; // Moderate MACD divergence
  }

  // Moving averages analysis
  const smaDiff = indicators.sma_20 - indicators.sma_50;
  const emaDiff = indicators.ema_12 - indicators.ema_26;

  if (Math.abs(smaDiff) > 5 && Math.abs(emaDiff) > 2) {
    confidence += 12; // Strong trend confirmation
  } else if (Math.abs(smaDiff) > 2 || Math.abs(emaDiff) > 1) {
    confidence += 6; // Moderate trend
  }

  // Bollinger Bands analysis
  const currentPrice = marketData.price;
  const bbPosition =
    (currentPrice - indicators.bollinger_lower) /
    (indicators.bollinger_upper - indicators.bollinger_lower);

  if (bbPosition < 0.2 || bbPosition > 0.8) {
    confidence += 8; // Price near Bollinger Band extremes
  } else if (bbPosition < 0.3 || bbPosition > 0.7) {
    confidence += 4; // Moderate Bollinger Band position
  }

  // Volume analysis (if available)
  if (marketData.volume > 1000000) {
    confidence += 3; // High volume confirmation
  }

  // Price momentum analysis
  if (Math.abs(marketData.changePercent) > 2) {
    confidence += 5; // Strong price movement
  } else if (Math.abs(marketData.changePercent) > 1) {
    confidence += 2; // Moderate price movement
  }

  // Cap confidence at 95 to maintain realism
  return Math.min(Math.max(confidence, 30), 95);
}

export async function POST(request: NextRequest) {
  try {
    const {
      symbol,
      marketData,
      primaryIndicators,
      allBarsData,
      allIndicators,
      timeframes,
      primaryTimeframe,
      analysisContext,
    }: AnalysisRequest = await request.json();

    // Log incoming market data
    // console.log("🔍 [AI Insights] Analysis request received:");
    // console.log("📊 [AI Insights] Symbol:", symbol);
    // console.log(
      "📊 [AI Insights] Market Data:",
      JSON.stringify(marketData, null, 2)
    );
    // console.log(
      "📊 [AI Insights] Primary Indicators:",
      JSON.stringify(primaryIndicators, null, 2)
    );
    // console.log("📊 [AI Insights] Timeframes:", timeframes);
    // console.log("📊 [AI Insights] Primary Timeframe:", primaryTimeframe);
    // console.log(
      "📊 [AI Insights] Analysis Context:",
      JSON.stringify(analysisContext, null, 2)
    );
    // console.log(
      "📊 [AI Insights] All Indicators Keys:",
      Object.keys(allIndicators)
    );

    if (!symbol || !marketData) {
      return NextResponse.json(
        { error: "Symbol and market data are required" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const verifyResponse = await fetch(
          `${request.nextUrl.origin}/api/auth/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );

        if (verifyResponse.ok) {
          const userData = await verifyResponse.json();
          userId = userData.user._id;
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
      }
    }

    // Check user credits if authenticated
    if (userId) {
      const db = await getDatabase();
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });

      // Allow free analysis - no credit check needed
      // if (!user || user.credits < 1) {
      //   return NextResponse.json(
      //     { error: "Insufficient credits for analysis" },
      //     { status: 402 }
      //   );
      // }
    }

    // Calculate confidence score based on technical indicators
    const confidenceScore = calculateConfidenceScore(
      primaryIndicators,
      marketData
    );

    // Create comprehensive prompt for professional analysis
    const prompt = `
You are a professional trading analyst. Analyze the following market data and provide a comprehensive trading analysis in the exact JSON format specified below.

MARKET CONTEXT:
- Symbol: ${symbol}
- Strategy: ${analysisContext.strategy} - ${analysisContext.strategyDescription}
- Primary Timeframe: ${primaryTimeframe}
- Additional Timeframes: ${timeframes.slice(1).join(", ")}
- Analysis Date: ${new Date().toLocaleDateString()}

CURRENT MARKET DATA:
- Current Price: $${marketData.price.toFixed(2)}
- Price Change: ${marketData.change >= 0 ? "+" : ""}${marketData.change.toFixed(
      2
    )} (${marketData.changePercent.toFixed(2)}%)
- Volume: ${marketData.volume.toLocaleString()}
- Day High: $${marketData.high.toFixed(2)}
- Day Low: $${marketData.low.toFixed(2)}
- Day Open: $${marketData.open.toFixed(2)}

MULTI-TIMEFRAME TECHNICAL INDICATORS:
${Object.entries(allIndicators)
  .map(
    ([tf, indicators]) => `
${tf} Timeframe:
- SMA 20: ${indicators.sma_20.toFixed(2)}
- SMA 50: ${indicators.sma_50.toFixed(2)}
- EMA 12: ${indicators.ema_12.toFixed(2)}
- EMA 26: ${indicators.ema_26.toFixed(2)}
- RSI: ${indicators.rsi.toFixed(2)}
- MACD: ${indicators.macd.toFixed(4)}
- MACD Signal: ${indicators.macd_signal.toFixed(4)}
- Bollinger Upper: ${indicators.bollinger_upper.toFixed(2)}
- Bollinger Lower: ${indicators.bollinger_lower.toFixed(2)}
- Bollinger Middle: ${indicators.bollinger_middle.toFixed(2)}
`
  )
  .join("\n")}

RECENT PRICE ACTION (Last 10 ${primaryTimeframe} bars):
${allBarsData[primaryTimeframe]
  ?.slice(-10)
  .map(
    (bar: any, i: number) =>
      `${i + 1}. ${bar.time}: O:$${bar.open.toFixed(2)} H:$${bar.high.toFixed(
        2
      )} L:$${bar.low.toFixed(2)} C:$${bar.close.toFixed(
        2
      )} V:${bar.volume.toLocaleString()}`
  )
  .join("\n")}

ANALYSIS REQUIREMENTS:
Provide a detailed professional trading analysis in the following exact JSON format:

{
  "meta": {
    "strategy_version": "1.5.4",
    "analysis_confidence_score": "${confidenceScore}"
  },
  "analysis": {
    "categories": {
      "short_term": {
        "timeframes": ["M1", "M5"],
        "summary": "Detailed short-term analysis focusing on immediate price action, momentum indicators, and micro patterns."
      },
      "mid_term": {
        "timeframes": ["M15", "M30"],
        "summary": "Mid-term analysis covering consolidation patterns, support/resistance levels, and trend continuation."
      },
      "long_term": {
        "timeframes": ["H1", "H4", "D1"],
        "summary": "Long-term trend analysis, major support/resistance zones, and overall market structure."
      }
    },
    "key_indicators": [
      "RSI analysis with specific readings",
      "MACD crossover analysis",
      "Volume analysis with spikes",
      "Bollinger Bands analysis",
      "Moving average analysis"
    ],
    "psychological_levels": {
      "support": "Strong: [price], Moderate: [price]",
      "resistance": "Strong: [price], Moderate: [price]"
    }
  },
  "simulation_strategy": {
    "direction": "Long|Short|Neutral",
    "timeframe": "Strategy description with timeframes",
    "theoretical_entry": {
      "price": "[specific price]",
      "reason": "Detailed entry rationale based on technical analysis"
    },
    "invalidation_point": {
      "price": "[specific price]",
      "reason": "Detailed invalidation reasoning"
    },
    "target_levels": [
      {
        "target_level": "t1",
        "price": "[specific price]",
        "reason": "First target rationale"
      },
      {
        "target_level": "t2",
        "price": "[specific price]",
        "reason": "Second target rationale"
      },
      {
        "target_level": "t3",
        "price": "[specific price]",
        "reason": "Third target rationale"
      }
    ],
    "simulation_allocation": {
      "parameter": "[risk percentage]",
      "adjustment": "Position sizing rationale"
    }
  },
  "implementation": {
    "simulation_steps": [
      {
        "step": 1,
        "condition": "Specific entry condition",
        "action": "Action to take"
      },
      {
        "step": 2,
        "condition": "Stop loss adjustment condition",
        "action": "Action to take"
      },
      {
        "step": 3,
        "condition": "Partial profit taking condition",
        "action": "Action to take"
      },
      {
        "step": 4,
        "condition": "Risk management condition",
        "action": "Action to take"
      },
      {
        "step": 5,
        "condition": "Final exit condition",
        "action": "Action to take"
      }
    ]
  },
  "technical_rationale": {
    "trend_analysis": "Multi-timeframe trend analysis",
    "volume_confirmation": "Volume analysis and confirmation",
    "reward_risk_calculation": "Risk/reward ratio analysis"
  },
  "contingency_scenarios": [
    {
      "scenario": "Bearish Reversal",
      "condition": "Specific reversal condition",
      "approach": {
        "direction": "Short",
        "entry_level": "[price]",
        "target_level": "[price]",
        "invalidation_level": "[price]",
        "reason": "Reversal rationale"
      }
    },
    {
      "scenario": "Continued Consolidation",
      "condition": "Consolidation condition",
      "approach": {
        "direction": "Neutral",
        "entry_level": "Wait for confirmation",
        "target_level": "None",
        "invalidation_level": "None",
        "reason": "Consolidation rationale"
      }
    }
  ]
}

Respond ONLY with valid JSON in the exact format above. Ensure all price levels are specific numbers, all timeframes are accurate, and all analysis is based on the provided technical data.
`;

    // Estimate tokens for credit tracking
    const estimatedTokens = estimateTokens(prompt);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    // Read raw response text for defensive logging and parsing
    const rawResponseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawResponseText);
    } catch (e) {
      console.warn("🤖 [AI Insights] Warning: Gemini response is not valid JSON. Storing raw text for inspection.");
      data = { rawText: rawResponseText };
    }

    // Defensive extraction of generated text (supporting both object and raw text responses)
    let generatedText = "";
    try {
      generatedText =
        data?.candidates?.[0]?.content?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.[0]?.content?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.generatedText ||
        data?.rawText ||
        "";
    } catch (e) {
      generatedText = data?.rawText || "";
    }

    // Log AI response
    // console.log("🤖 [AI Insights] Gemini API Response (defensive logging):");
    // console.log("🤖 [AI Insights] Raw Response Length:", generatedText.length || rawResponseText.length);
    // console.log(
      "🤖 [AI Insights] Raw Response Preview:",
      (generatedText || rawResponseText).substring(0, 1000) + "..."
    );

    // Parse the JSON response
    let analysis: any;
    try {
      const jsonMatch = (generatedText || rawResponseText).match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, store raw text under analysis.raw to aid debugging
        analysis = { raw: generatedText || rawResponseText };
        console.warn("❗ [AI Insights] No JSON object found in AI response. Saving raw text under analysis.raw");
      } else {
        analysis = JSON.parse(jsonMatch[0]);

        // Log parsed analysis
        // console.log("✅ [AI Insights] Successfully parsed AI analysis:");
        // console.log(
          "📊 [AI Insights] Analysis Structure:",
          JSON.stringify(analysis, null, 2)
        );
        // console.log("📊 [AI Insights] Analysis Keys:", Object.keys(analysis));

        if (analysis.meta) {
          // console.log(
            "📊 [AI Insights] Meta Data:",
            JSON.stringify(analysis.meta, null, 2)
          );
        }
        if (analysis.analysis) {
          // console.log(
            "📊 [AI Insights] Analysis Categories:",
            Object.keys(analysis.analysis)
          );
        }
        if (analysis.simulation_strategy) {
          // console.log(
            "📊 [AI Insights] Simulation Strategy:",
            JSON.stringify(analysis.simulation_strategy, null, 2)
          );
        }
      }
    } catch (parseError) {
      console.error(
        "❌ [AI Insights] Error parsing Gemini response:",
        parseError
      );
      console.error("❌ [AI Insights] Raw response:", generatedText || rawResponseText);
      // Store raw text into analysis to avoid failing the entire request
      analysis = { raw: generatedText || rawResponseText };
    }

    // Normalize analysis to a string for storage. If analysis is only raw text, wrap it.
    let analysisForStorage: string;
    if (typeof analysis === "string") {
      analysisForStorage = analysis;
    } else if (analysis && typeof analysis === "object") {
      analysisForStorage = JSON.stringify(analysis);
    } else {
      analysisForStorage = JSON.stringify({ raw: generatedText || "" });
    }

    // Create analysis record for MongoDB
    const analysisRecord = {
      publicId: generatePublicId(),
      symbol: symbol.toUpperCase(),
      timeframe: analysisContext.strategy,
      analysis: analysisForStorage,
      isArchived: false,
      newsWarnings: [],
      creditUsed: false, // Free analysis - no credits used
      validationToken: null,
      validationAttempted: false,
      metadata: {
        creditType: "free_analysis", // Updated to reflect free analysis
        tokensUsed: estimatedTokens,
        strategy: analysisContext.strategy,
        timeframes: timeframes,
        primaryTimeframe: primaryTimeframe,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      votes: [],
      userVote: null,
      isInvalid: false,
    };

    // Store in MongoDB
    const db = await getDatabase();
    const result = await db.collection("analyses").insertOne(analysisRecord);

    // Log database storage
    // console.log("💾 [AI Insights] Analysis stored in database:");
    // console.log("💾 [AI Insights] MongoDB ID:", result.insertedId);
    // console.log("💾 [AI Insights] Public ID:", analysisRecord.publicId);
    // console.log("💾 [AI Insights] Symbol:", analysisRecord.symbol);
    // console.log("💾 [AI Insights] Strategy:", analysisRecord.timeframe);

    // Free analysis - no credit deduction
    // if (userId) {
    //   await db
    //     .collection("users")
    //     .updateOne({ _id: new ObjectId(userId) }, { $inc: { credits: -1 } });
    // }

    // Return the analysis with the MongoDB ID
    const responseData = {
      ...analysisRecord,
      _id: result.insertedId,
    };

    // console.log("✅ [AI Insights] Analysis completed successfully");
    // console.log(
      "✅ [AI Insights] Response data keys:",
      Object.keys(responseData)
    );

    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in AI insights API:", errorMessage);
    console.error("❌ Full error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate AI insights",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function generatePublicId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
