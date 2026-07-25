// Alpha Vantage API service for market data
interface AlphaVantageQuoteResponse {
  "Global Quote"?: {
    "01. symbol": string;
    "02. open": string;
    "03. high": string;
    "04. low": string;
    "05. price": string;
    "06. volume": string;
    "07. latest trading day": string;
    "08. previous close": string;
    "09. change": string;
    "10. change percent": string;
  };
  "Error Message"?: string;
  "Note"?: string;
}

interface AlphaVantageTimeSeriesResponse {
  "Meta Data"?: {
    "1. Information": string;
    "2. Symbol": string;
    "3. Last Refreshed": string;
    "4. Interval": string;
    "5. Output Size": string;
    "6. Time Zone": string;
  };
  "Time Series (Daily)"?: Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  "Time Series (1min)"?: Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  "Time Series (5min)"?: Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  "Time Series (15min)"?: Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  "Time Series (30min)"?: Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  "Time Series (60min)"?: Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  "Error Message"?: string;
  "Note"?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  lastUpdated: string;
}

export interface TimeSeriesData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ ALPHA_VANTAGE_API_KEY not found in environment variables');
    }
  }

  /**
   * Maps symbols to Alpha Vantage format
   */
  private mapSymbolToAlphaVantage(symbol: string): string {
    // Handle different symbol formats
    if (symbol.startsWith('OANDA:')) {
      return symbol.replace('OANDA:', '');
    }
    if (symbol.startsWith('FX:')) {
      return symbol.replace('FX:', '');
    }
    if (symbol.includes('=X')) {
      return symbol.replace('=X', '');
    }
    if (symbol.includes('=F')) {
      return symbol.replace('=F', '');
    }
    
    // For gold specifically
    if (symbol === 'XAUUSD') {
      return 'XAUUSD'; // Alpha Vantage supports XAUUSD
    }
    
    return symbol;
  }

  /**
   * Gets real-time quote data for a symbol
   */
  async getQuote(symbol: string): Promise<MarketData | null> {
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const mappedSymbol = this.mapSymbolToAlphaVantage(symbol);
    const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${mappedSymbol}&apikey=${this.apiKey}`;

    try {
      // console.log(`🔍 [Alpha Vantage] Fetching quote for ${symbol} (mapped to ${mappedSymbol})`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AlphaVantageQuoteResponse = await response.json();

      // Check for API errors
      if (data["Error Message"]) {
        console.error(`❌ [Alpha Vantage] Error for ${symbol}:`, data["Error Message"]);
        return null;
      }

      if (data["Note"]) {
        console.warn(`⚠️ [Alpha Vantage] Rate limit note for ${symbol}:`, data["Note"]);
        return null;
      }

      if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
        console.warn(`⚠️ [Alpha Vantage] No quote data for ${symbol}`);
        return null;
      }

      const quote = data["Global Quote"];
      
      const marketData: MarketData = {
        symbol: quote["01. symbol"],
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePercent: parseFloat(quote["10. change percent"].replace('%', '')),
        volume: parseInt(quote["06. volume"]),
        high: parseFloat(quote["03. high"]),
        low: parseFloat(quote["04. low"]),
        open: parseFloat(quote["02. open"]),
        lastUpdated: quote["07. latest trading day"]
      };

      // console.log(`✅ [Alpha Vantage] Successfully fetched quote for ${symbol}:`, marketData);
      return marketData;

    } catch (error) {
      console.error(`❌ [Alpha Vantage] Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Gets time series data for a symbol
   */
  async getTimeSeries(
    symbol: string, 
    interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' = 'daily',
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<TimeSeriesData[]> {
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const mappedSymbol = this.mapSymbolToAlphaVantage(symbol);
    const functionName = interval === 'daily' ? 'TIME_SERIES_DAILY' : `TIME_SERIES_INTRADAY`;
    
    let url = `${this.baseUrl}?function=${functionName}&symbol=${mappedSymbol}&apikey=${this.apiKey}`;
    
    if (interval !== 'daily') {
      url += `&interval=${interval}`;
    }
    
    url += `&outputsize=${outputSize}`;

    try {
      // console.log(`📊 [Alpha Vantage] Fetching time series for ${symbol} (${interval})`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AlphaVantageTimeSeriesResponse = await response.json();

      // Check for API errors
      if (data["Error Message"]) {
        console.error(`❌ [Alpha Vantage] Error for ${symbol}:`, data["Error Message"]);
        return [];
      }

      if (data["Note"]) {
        console.warn(`⚠️ [Alpha Vantage] Rate limit note for ${symbol}:`, data["Note"]);
        return [];
      }

      // Get the appropriate time series data
      let timeSeriesKey = '';
      if (interval === 'daily') {
        timeSeriesKey = 'Time Series (Daily)';
      } else {
        timeSeriesKey = `Time Series (${interval})`;
      }

      const timeSeries = data[timeSeriesKey as keyof AlphaVantageTimeSeriesResponse];
      if (!timeSeries) {
        console.warn(`⚠️ [Alpha Vantage] No time series data for ${symbol}`);
        return [];
      }

      const result: TimeSeriesData[] = Object.entries(timeSeries)
        .map(([timestamp, values]) => ({
          timestamp: new Date(timestamp).getTime(),
          open: parseFloat(values["1. open"]),
          high: parseFloat(values["2. high"]),
          low: parseFloat(values["3. low"]),
          close: parseFloat(values["4. close"]),
          volume: parseInt(values["5. volume"])
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // console.log(`✅ [Alpha Vantage] Successfully fetched ${result.length} time series points for ${symbol}`);
      return result;

    } catch (error) {
      console.error(`❌ [Alpha Vantage] Error fetching time series for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Gets multiple quotes at once (for watchlists)
   */
  async getMultipleQuotes(symbols: string[]): Promise<Record<string, MarketData>> {
    const results: Record<string, MarketData> = {};
    
    // Alpha Vantage has rate limits, so we'll fetch them sequentially with delays
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        if (quote) {
          results[symbol] = quote;
        }
        
        // Add delay to respect rate limits (5 calls per minute for free tier)
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second delay
      } catch (error) {
        console.error(`❌ [Alpha Vantage] Error fetching quote for ${symbol}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Checks if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const alphaVantageService = new AlphaVantageService();
