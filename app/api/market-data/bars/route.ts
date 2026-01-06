import { NextRequest, NextResponse } from "next/server";
import { mapSymbolToYahoo } from "@/lib/symbol-mapping";

const YAHOO_FINANCE_BASE_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart";

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
        regularMarketTime: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
    error?: any;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const timeframe = searchParams.get("timeframe") || "1d";
  const limit = parseInt(searchParams.get("limit") || "250");

  // console.log(
    `📊 Bars API called for symbol: ${symbol}, timeframe: ${timeframe}, limit: ${limit}`
  );

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // Convert symbol to Yahoo Finance format
    const yahooSymbol = mapSymbolToYahoo(symbol);
    // console.log(
      `🔄 Converted ${symbol} to Yahoo Finance format: ${yahooSymbol}`
    );

    // Map timeframes to Yahoo Finance intervals
    const interval = getYahooInterval(timeframe);
    const range = getYahooRange(timeframe, limit);

    // Fetch data from Yahoo Finance
    const url = `${YAHOO_FINANCE_BASE_URL}/${yahooSymbol}?interval=${interval}&range=${range}`;
    // console.log(`🌐 Fetching bars from Yahoo Finance: ${url}`);

    const response = await fetch(url);
    const data: YahooFinanceResponse = await response.json();

    // console.log(
      `📊 Yahoo Finance bars response for ${symbol}:`,
      JSON.stringify(data, null, 2)
    );

    if (
      data.chart.error ||
      !data.chart.result ||
      data.chart.result.length === 0
    ) {
      // console.log(
        `❌ No bars data found for ${symbol}, falling back to mock data`
      );
      const bars = generateMockBars(symbol, timeframe, limit);
      return NextResponse.json({
        symbol,
        timeframe,
        bars,
        count: bars.length,
      });
    }

    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;

    // Transform Yahoo Finance data to our format
    const bars = timestamps
      .map((timestamp, index) => ({
        time: timestamp,
        open: quote.open[index] || 0,
        high: quote.high[index] || 0,
        low: quote.low[index] || 0,
        close: quote.close[index] || 0,
        volume: quote.volume[index] || 0,
      }))
      .filter((bar) => bar.open > 0 && bar.close > 0); // Filter out invalid data

    // console.log(`✅ Returning ${bars.length} bars for ${symbol}`);

    return NextResponse.json({
      symbol,
      timeframe,
      bars,
      count: bars.length,
    });
  } catch (error) {
    console.error(`❌ Error fetching bars for ${symbol}:`, error);

    // Fallback to mock data on error
    // console.log(`🔄 Falling back to mock bars for ${symbol} due to error`);
    const bars = generateMockBars(symbol, timeframe, limit);

    return NextResponse.json({
      symbol,
      timeframe,
      bars,
      count: bars.length,
    });
  }
}

function getYahooInterval(timeframe: string): string {
  switch (timeframe) {
    case "1":
      return "1m";
    case "5":
      return "5m";
    case "15":
      return "15m";
    case "30":
      return "30m";
    case "60":
      return "1h";
    case "1D":
      return "1d";
    case "1W":
      return "1wk";
    default:
      return "1d";
  }
}

function getYahooRange(timeframe: string, limit: number): string {
  // Calculate appropriate range based on timeframe and limit
  switch (timeframe) {
    case "1":
    case "5":
    case "15":
    case "30":
      return "7d"; // 7 days for intraday data
    case "60":
      return "60d"; // 60 days for hourly data
    case "1D":
      return "1y"; // 1 year for daily data
    case "1W":
      return "5y"; // 5 years for weekly data
    default:
      return "1y";
  }
}

function generateMockBars(symbol: string, timeframe: string, limit: number) {
  const bars = [];
  const basePrice = 150 + Math.random() * 50; // Random base price between 150-200
  let currentPrice = basePrice;

  const now = new Date();
  const timeframeMs = getTimeframeMs(timeframe);

  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now.getTime() - i * timeframeMs;
    const date = new Date(timestamp);

    // Generate realistic price movement
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice += change;

    const high = currentPrice + Math.random() * currentPrice * 0.01;
    const low = currentPrice - Math.random() * currentPrice * 0.01;
    const open = currentPrice - change * 0.3;
    const close = currentPrice;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    bars.push({
      time: Math.floor(timestamp / 1000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume,
    });
  }

  return bars;
}

function getTimeframeMs(timeframe: string): number {
  switch (timeframe) {
    case "1":
      return 60 * 1000; // 1 minute
    case "5":
      return 5 * 60 * 1000; // 5 minutes
    case "15":
      return 15 * 60 * 1000; // 15 minutes
    case "30":
      return 30 * 60 * 1000; // 30 minutes
    case "60":
      return 60 * 60 * 1000; // 1 hour
    case "1D":
      return 24 * 60 * 60 * 1000; // 1 day
    case "1W":
      return 7 * 24 * 60 * 60 * 1000; // 1 week
    default:
      return 24 * 60 * 60 * 1000; // Default to 1 day
  }
}
