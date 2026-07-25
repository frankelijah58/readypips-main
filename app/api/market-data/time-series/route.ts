import { NextRequest, NextResponse } from "next/server";
import { alphaVantageService } from "@/lib/alpha-vantage-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") as '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' || 'daily';
  const outputSize = searchParams.get("outputSize") as 'compact' | 'full' || 'compact';

  // console.log(`📊 Time Series API called for symbol: ${symbol}, interval: ${interval}, outputSize: ${outputSize}`);

  if (!symbol) {
    return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 });
  }

  try {
    // Check if Alpha Vantage is configured
    if (!alphaVantageService.isConfigured()) {
      return NextResponse.json(
        { error: "Alpha Vantage API key not configured" },
        { status: 503 }
      );
    }

    // Fetch time series data from Alpha Vantage
    const timeSeriesData = await alphaVantageService.getTimeSeries(symbol, interval, outputSize);

    if (timeSeriesData.length === 0) {
      return NextResponse.json(
        { error: "No time series data found for the specified symbol" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol,
      interval,
      outputSize,
      data: timeSeriesData,
      count: timeSeriesData.length
    });

  } catch (error) {
    console.error(`❌ Error fetching time series data for ${symbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch time series data" },
      { status: 500 }
    );
  }
}
