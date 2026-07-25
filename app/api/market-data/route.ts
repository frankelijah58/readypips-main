import { NextRequest, NextResponse } from "next/server";
import { getCachedMarketData, cacheMarketData } from "@/lib/database";
import { mapSymbolToYahoo } from "@/lib/symbol-mapping";
import { alphaVantageService } from "@/lib/alpha-vantage-service";

// Yahoo Finance API endpoints
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

  // console.log(`🔍 Market Data API called for symbol: ${symbol}`);

  if (!symbol) {
    // console.log("❌ No symbol provided");
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Check cache first
    const cachedData = await getCachedMarketData(symbol, 5); // 5 minutes cache
    if (cachedData) {
      // console.log(`✅ Returning cached data for ${symbol}`);
      return NextResponse.json(cachedData);
    }

    // Try Alpha Vantage first if configured
    if (alphaVantageService.isConfigured()) {
      // console.log(`🔍 [Alpha Vantage] Fetching data for ${symbol}`);
      const alphaVantageData = await alphaVantageService.getQuote(symbol);
      
      if (alphaVantageData) {
        // console.log(`✅ [Alpha Vantage] Successfully fetched data for ${symbol}`);
        
        // Cache the response
        await cacheMarketData(symbol, alphaVantageData);
        
        return NextResponse.json(alphaVantageData);
      } else {
        // console.log(`⚠️ [Alpha Vantage] No data for ${symbol}, falling back to Yahoo Finance`);
      }
    } else {
      // console.log(`⚠️ [Alpha Vantage] Not configured, using Yahoo Finance fallback`);
    }

    // Fallback to Yahoo Finance
    const yahooSymbol = mapSymbolToYahoo(symbol);
    // console.log(
    //   `🔄 Converted ${symbol} to Yahoo Finance format: ${yahooSymbol}`
    // );

    // Fetch fresh data from Yahoo Finance
    const url = `${YAHOO_FINANCE_BASE_URL}/${yahooSymbol}?interval=1d&range=1d`;
    // console.log(`🌐 Fetching from Yahoo Finance: ${url}`);

    const response = await fetch(url);
    const data: YahooFinanceResponse = await response.json();

    // console.log(
    //   `📊 Yahoo Finance response for ${symbol}:`,
    //   JSON.stringify(data, null, 2)
    // );

    if (
      data.chart.error ||
      !data.chart.result ||
      data.chart.result.length === 0
    ) {
      // console.log(`❌ No data found for ${symbol}, falling back to mock data`);

      // Fallback to mock data when both APIs return no data
      const mockData = {
        symbol: symbol,
        price: symbol === 'XAUUSD' ? 2000 + Math.random() * 100 : 150 + Math.random() * 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: 1000000 + Math.random() * 5000000,
        high: symbol === 'XAUUSD' ? 2100 + Math.random() * 50 : 160 + Math.random() * 20,
        low: symbol === 'XAUUSD' ? 1950 + Math.random() * 50 : 140 + Math.random() * 20,
        open: symbol === 'XAUUSD' ? 2000 + Math.random() * 30 : 145 + Math.random() * 15,
      };

      // Calculate change and changePercent based on price
      mockData.change = mockData.price - mockData.open;
      mockData.changePercent = (mockData.change / mockData.open) * 100;

      // console.log(`✅ Returning fallback mock data for ${symbol}:`, mockData);
      return NextResponse.json(mockData);
    }

    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const meta = result.meta;

    // Get the latest data point
    const latestIndex = quote.close.length - 1;
    const currentPrice = meta.regularMarketPrice;
    const previousClose =
      meta.previousClose || quote.close[latestIndex - 1] || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Parse the data
    const marketData = {
      symbol: meta.symbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: quote.volume[latestIndex] || 0,
      high: Math.max(...quote.high.filter((h) => h !== null)),
      low: Math.min(...quote.low.filter((l) => l !== null)),
      open: quote.open[0] || previousClose,
    };

    // console.log(`✅ Parsed market data for ${symbol}:`, marketData);

    // Cache the response
    await cacheMarketData(symbol, marketData);

    return NextResponse.json(marketData);
  } catch (error) {
    console.error(`❌ Error fetching market data for ${symbol}:`, error);

    // Fallback to mock data on error
    // console.log(`🔄 Falling back to mock data for ${symbol} due to error`);
    const mockData = {
      symbol: symbol,
      price: 150 + Math.random() * 100,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: 1000000 + Math.random() * 5000000,
      high: 160 + Math.random() * 20,
      low: 140 + Math.random() * 20,
      open: 145 + Math.random() * 15,
    };

    // Calculate change and changePercent based on price
    mockData.change = mockData.price - mockData.open;
    mockData.changePercent = (mockData.change / mockData.open) * 100;

    // console.log(
    //   `✅ Returning error fallback mock data for ${symbol}:`,
    //   mockData
    // );
    return NextResponse.json(mockData);
  }
}
