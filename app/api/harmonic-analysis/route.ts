import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { mapSymbolToYahoo, getAlternativeSymbols } from "@/lib/symbol-mapping";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const timeframe = searchParams.get("timeframe");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    if (!timeframe) {
      return NextResponse.json(
        { error: "Timeframe parameter is required" },
        { status: 400 }
      );
    }

    // console.log(`🔍 Starting harmonic analysis for ${symbol} (${timeframe})`);

    // Map the symbol to Yahoo Finance format
    const mappedSymbol = mapSymbolToYahoo(symbol);
    // console.log(`🔄 [Harmonic Analysis] Mapping ${symbol} to ${mappedSymbol}`);

    // Validate interval - only allow valid Yahoo Finance intervals
    const validIntervals = ["1d", "1wk", "1mo"];
    let validInterval = timeframe.toLowerCase();
    if (!validIntervals.includes(validInterval)) {
      console.warn(
        `⚠️ Invalid interval "${timeframe}" for ${mappedSymbol}, using "1d" instead`
      );
      validInterval = "1d";
    }

    // Calculate start date based on period (get more data for analysis)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 200); // Get 200 days of data

    const queryOptions = {
      period1: startDate,
      period2: endDate,
      interval: validInterval as any,
    };

    let result: any[] = [];
    let usedSymbol = mappedSymbol;

    try {
      // Try the primary mapped symbol
      result = await yahooFinance.historical(mappedSymbol, queryOptions);
      // console.log(
        `📊 [Harmonic Analysis] Successfully fetched ${result.length} bars for ${mappedSymbol} (${validInterval} timeframe)`
      );
    } catch (error) {
      console.warn(
        `⚠️ [Harmonic Analysis] Primary symbol ${mappedSymbol} failed, trying alternatives...`
      );

      // Try alternative symbols
      const alternatives = getAlternativeSymbols(symbol);
      let success = false;

      for (const altSymbol of alternatives) {
        try {
          result = await yahooFinance.historical(altSymbol, queryOptions);
          usedSymbol = altSymbol;
          // console.log(
            `✅ [Harmonic Analysis] Successfully fetched ${result.length} bars using alternative symbol ${altSymbol}`
          );
          success = true;
          break;
        } catch (altError) {
          console.warn(
            `⚠️ [Harmonic Analysis] Alternative symbol ${altSymbol} also failed`
          );
          continue;
        }
      }

      if (!success) {
        console.error(
          `❌ [Harmonic Analysis] All symbols failed for ${symbol}`
        );
        return NextResponse.json(
          {
            error: "Unable to fetch market data for this symbol",
            originalSymbol: symbol,
            attemptedSymbols: [mappedSymbol, ...alternatives],
          },
          { status: 500 }
        );
      }
    }

    if (result.length < 50) {
      return NextResponse.json(
        {
          error: "Insufficient data for harmonic analysis",
          dataPoints: result.length,
          minimumRequired: 50,
        },
        { status: 400 }
      );
    }

    // Transform the data to match expected format
    const candles = result.map((candle) => ({
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume || 0,
      time: candle.date.getTime(),
    }));

    // console.log(`📊 Analyzed ${candles.length} bars for harmonic patterns`);

    // Simulate harmonic pattern analysis
    // In a real implementation, you would use the Frank State Strategy here
    const patterns = [];
    const fibLevels: { [key: string]: number } = {};

    // Generate some sample patterns for demonstration
    if (candles.length > 50) {
      const currentPrice = candles[candles.length - 1].close;
      const high = Math.max(...candles.map((c) => c.high));
      const low = Math.min(...candles.map((c) => c.low));
      const range = high - low;

      // Simulate some patterns
      if (currentPrice > high * 0.8) {
        patterns.push({
          name: "Bullish Gartley",
          type: "bullish",
          confidence: 75,
          entryPrice: currentPrice,
          targetPrice: currentPrice + range * 0.618,
          stopLoss: currentPrice - range * 0.382,
          ratios: {
            xab: 0.618,
            abc: 0.382,
            bcd: 1.272,
            xad: 0.786,
          },
        });
      }

      if (currentPrice < low * 1.2) {
        patterns.push({
          name: "Bearish Butterfly",
          type: "bearish",
          confidence: 68,
          entryPrice: currentPrice,
          targetPrice: currentPrice - range * 0.618,
          stopLoss: currentPrice + range * 0.382,
          ratios: {
            xab: 0.786,
            abc: 0.382,
            bcd: 1.618,
            xad: 1.272,
          },
        });
      }

      // Generate Fibonacci levels
      fibLevels["0.236"] = low + range * 0.236;
      fibLevels["0.382"] = low + range * 0.382;
      fibLevels["0.500"] = low + range * 0.5;
      fibLevels["0.618"] = low + range * 0.618;
      fibLevels["0.786"] = low + range * 0.786;
      fibLevels["1.000"] = high;
    }

    // console.log(
      `✅ Harmonic analysis complete: ${patterns.length} patterns found`
    );

    return NextResponse.json({
      success: true,
      symbol: usedSymbol,
      originalSymbol: symbol,
      timeframe: validInterval,
      patterns,
      fibLevels,
      lastUpdate: new Date(),
      dataPoints: candles.length,
    });
  } catch (error) {
    console.error("Error in harmonic analysis:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
