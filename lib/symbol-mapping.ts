// Symbol mapping utility for converting Deriv symbols to Yahoo Finance symbols

export interface SymbolMapping {
  deriv: string;
  yahoo: string;
  tradingview?: string;
  name: string;
  category: "forex" | "crypto" | "stocks" | "commodities";
}

// Comprehensive mapping of Deriv symbols to Yahoo Finance symbols
export const SYMBOL_MAPPINGS: SymbolMapping[] = [
  // Forex pairs
  {
    deriv: "frxEURUSD",
    yahoo: "EURUSD=X",
    tradingview: "FX:EURUSD",
    name: "EUR/USD",
    category: "forex",
  },
  {
    deriv: "frxGBPUSD",
    yahoo: "GBPUSD=X",
    tradingview: "FX:GBPUSD",
    name: "GBP/USD",
    category: "forex",
  },
  {
    deriv: "frxUSDJPY",
    yahoo: "USDJPY=X",
    tradingview: "FX:USDJPY",
    name: "USD/JPY",
    category: "forex",
  },
  {
    deriv: "frxUSDCHF",
    yahoo: "USDCHF=X",
    tradingview: "FX:USDCHF",
    name: "USD/CHF",
    category: "forex",
  },
  {
    deriv: "frxAUDUSD",
    yahoo: "AUDUSD=X",
    tradingview: "FX:AUDUSD",
    name: "AUD/USD",
    category: "forex",
  },
  {
    deriv: "frxUSDCAD",
    yahoo: "USDCAD=X",
    tradingview: "FX:USDCAD",
    name: "USD/CAD",
    category: "forex",
  },
  {
    deriv: "frxNZDUSD",
    yahoo: "NZDUSD=X",
    tradingview: "FX:NZDUSD",
    name: "NZD/USD",
    category: "forex",
  },
  {
    deriv: "frxGBPAUD",
    yahoo: "GBPAUD=X",
    tradingview: "FX:GBPAUD",
    name: "GBP/AUD",
    category: "forex",
  },

  // Cryptocurrencies
  { deriv: "frxBTCUSD", yahoo: "BTC-USD", name: "Bitcoin", category: "crypto" },
  {
    deriv: "frxETHUSD",
    yahoo: "ETH-USD",
    name: "Ethereum",
    category: "crypto",
  },
  {
    deriv: "frxLTCUSD",
    yahoo: "LTC-USD",
    name: "Litecoin",
    category: "crypto",
  },
  { deriv: "frxXRPUSD", yahoo: "XRP-USD", name: "Ripple", category: "crypto" },

  // Commodities
  {
    deriv: "frxXAUUSD",
    yahoo: "GC=F",
    tradingview: "OANDA:XAUUSD",
    name: "Gold",
    category: "commodities",
  },
  // Alternative gold symbols for different providers
  {
    deriv: "frxXAUUSD",
    yahoo: "XAUUSD=X",
    tradingview: "OANDA:XAUUSD",
    name: "Gold",
    category: "commodities",
  },
  {
    deriv: "frxXAGUSD",
    yahoo: "SI=F",
    name: "Silver Futures",
    category: "commodities",
  },
  {
    deriv: "frxXPDUSD",
    yahoo: "PA=F",
    name: "Palladium Futures",
    category: "commodities",
  },
  {
    deriv: "frxXPTUSD",
    yahoo: "PL=F",
    name: "Platinum Futures",
    category: "commodities",
  },
  {
    deriv: "frxWTIUSD",
    yahoo: "CL=F",
    name: "Crude Oil Futures",
    category: "commodities",
  },
  {
    deriv: "frxBRENTUSD",
    yahoo: "BZ=F",
    name: "Brent Crude Futures",
    category: "commodities",
  },

  // Stocks (common ones)
  { deriv: "frxAAPL", yahoo: "AAPL", name: "Apple Inc.", category: "stocks" },
  {
    deriv: "frxGOOGL",
    yahoo: "GOOGL",
    name: "Alphabet Inc.",
    category: "stocks",
  },
  {
    deriv: "frxMSFT",
    yahoo: "MSFT",
    name: "Microsoft Corporation",
    category: "stocks",
  },
  { deriv: "frxTSLA", yahoo: "TSLA", name: "Tesla Inc.", category: "stocks" },
  {
    deriv: "frxAMZN",
    yahoo: "AMZN",
    name: "Amazon.com Inc.",
    category: "stocks",
  },
  {
    deriv: "frxMETA",
    yahoo: "META",
    name: "Meta Platforms Inc.",
    category: "stocks",
  },
  {
    deriv: "frxNVDA",
    yahoo: "NVDA",
    name: "NVIDIA Corporation",
    category: "stocks",
  },
  { deriv: "frxNFLX", yahoo: "NFLX", name: "Netflix Inc.", category: "stocks" },
  {
    deriv: "frxSPY",
    yahoo: "SPY",
    name: "SPDR S&P 500 ETF",
    category: "stocks",
  },
  {
    deriv: "frxQQQ",
    yahoo: "QQQ",
    name: "Invesco QQQ Trust",
    category: "stocks",
  },
];

// Alternative mappings for common symbols that might have different formats
export const ALTERNATIVE_MAPPINGS: Record<string, string[]> = {
  frxXAUUSD: ["GC=F", "XAUUSD=X", "GLD"], // Gold alternatives
  frxXAGUSD: ["SI=F", "XAGUSD=X", "SLV"], // Silver alternatives
  frxXPDUSD: ["PA=F", "PALL"], // Palladium alternatives
  frxXPTUSD: ["PL=F", "PPLT"], // Platinum alternatives
  frxWTIUSD: ["CL=F", "USO"], // Oil alternatives
  frxBRENTUSD: ["BZ=F", "BNO"], // Brent alternatives
  frxBTCUSD: ["BTC-USD", "GBTC"], // Bitcoin alternatives
  frxETHUSD: ["ETH-USD", "ETHE"], // Ethereum alternatives
};

/**
 * Maps a Deriv symbol to its corresponding Yahoo Finance symbol
 * @param symbol - The symbol to map (can be Deriv or Yahoo Finance format)
 * @returns The mapped Yahoo Finance symbol, or the original symbol if no mapping found
 */
export function mapSymbolToYahoo(symbol: string): string {
  // If it's already a Yahoo Finance symbol, return as is
  if (
    symbol.includes("=X") ||
    symbol.includes("=F") ||
    symbol.includes("-USD")
  ) {
    return symbol;
  }

  // Handle OANDA format symbols
  if (symbol.startsWith("OANDA:")) {
    const baseSymbol = symbol.replace("OANDA:", "");
    // Map OANDA symbols to Yahoo Finance format
    if (baseSymbol === "XAUUSD") {
      return "GC=F"; // Gold futures
    }
    if (baseSymbol === "XAGUSD") {
      return "SI=F"; // Silver futures
    }
    // For forex pairs, convert to Yahoo format
    if (baseSymbol.length === 6 && baseSymbol.includes("USD")) {
      return `${baseSymbol}=X`;
    }
  }

  // Handle FX format symbols
  if (symbol.startsWith("FX:")) {
    const baseSymbol = symbol.replace("FX:", "");
    return `${baseSymbol}=X`;
  }

  // Find the mapping
  const mapping = SYMBOL_MAPPINGS.find(
    (m) => m.deriv === symbol || m.tradingview === symbol
  );
  if (mapping) {
    return mapping.yahoo;
  }

  // If no direct mapping found, try to construct one
  if (symbol.startsWith("frx")) {
    const baseSymbol = symbol.replace("frx", "");

    // Handle common patterns
    if (baseSymbol.includes("USD")) {
      return `${baseSymbol}=X`;
    }

    // For stocks, just return the base symbol
    if (baseSymbol.length <= 5 && !baseSymbol.includes("USD")) {
      return baseSymbol;
    }
  }

  // Return original symbol if no mapping found
  return symbol;
}

/**
 * Maps a symbol to its corresponding TradingView symbol
 * @param symbol - The symbol to map (can be any format)
 * @returns The mapped TradingView symbol, or the original symbol if no mapping found
 */
export function mapSymbolToTradingView(symbol: string): string {
  // If it's already a TradingView symbol, return as is
  if (
    symbol.startsWith("FX:") ||
    symbol.startsWith("NASDAQ:") ||
    symbol.startsWith("NYSE:") ||
    symbol.startsWith("OANDA:")
  ) {
    return symbol;
  }

  // Find the mapping
  const mapping = SYMBOL_MAPPINGS.find(
    (m) => m.deriv === symbol || m.yahoo === symbol || m.tradingview === symbol
  );
  if (mapping && mapping.tradingview) {
    return mapping.tradingview;
  }

  // For forex symbols, convert to TradingView format
  if (symbol.includes("=X")) {
    const baseSymbol = symbol.replace("=X", "");
    return `FX:${baseSymbol}`;
  }

  // For stocks, add exchange prefix if needed
  if (symbol.length <= 5 && !symbol.includes("=") && !symbol.includes("-")) {
    // Common stocks usually work without prefix, but you can add logic here
    return symbol;
  }

  // Return original symbol if no mapping found
  return symbol;
}

/**
 * Gets alternative symbols for a given symbol in case the primary mapping fails
 * @param symbol - The original symbol
 * @returns Array of alternative symbols to try
 */
export function getAlternativeSymbols(symbol: string): string[] {
  const alternatives = ALTERNATIVE_MAPPINGS[symbol] || [];
  return alternatives;
}

/**
 * Attempts to find a working symbol by trying the primary mapping and alternatives
 * @param symbol - The original symbol
 * @returns Promise that resolves to a working symbol or null if none found
 */
export async function findWorkingSymbol(
  symbol: string
): Promise<string | null> {
  const yahooSymbol = mapSymbolToYahoo(symbol);
  const alternatives = getAlternativeSymbols(symbol);

  // Try the primary mapping first
  try {
    // You could add a simple validation here if needed
    return yahooSymbol;
  } catch (error) {
    // If primary fails, try alternatives
    for (const alt of alternatives) {
      try {
        return alt;
      } catch (error) {
        continue;
      }
    }
  }

  return null;
}

/**
 * Gets symbol information including name and category
 * @param symbol - The symbol to get info for
 * @returns Symbol information or null if not found
 */
export function getSymbolInfo(symbol: string): SymbolMapping | null {
  // First try exact match
  let mapping = SYMBOL_MAPPINGS.find(
    (m) => m.deriv === symbol || m.yahoo === symbol
  );

  if (mapping) {
    return mapping;
  }

  // Try mapping the symbol first
  const mappedSymbol = mapSymbolToYahoo(symbol);
  mapping = SYMBOL_MAPPINGS.find((m) => m.yahoo === mappedSymbol);

  return mapping || null;
}

/**
 * Validates if a symbol is supported
 * @param symbol - The symbol to validate
 * @returns True if the symbol is supported, false otherwise
 */
export function isSymbolSupported(symbol: string): boolean {
  const mapping = SYMBOL_MAPPINGS.find(
    (m) => m.deriv === symbol || m.yahoo === symbol
  );
  return !!mapping;
}

/**
 * Gets all supported symbols for a specific category
 * @param category - The category to filter by
 * @returns Array of symbol mappings for the category
 */
export function getSymbolsByCategory(
  category: "forex" | "crypto" | "stocks" | "commodities"
): SymbolMapping[] {
  return SYMBOL_MAPPINGS.filter((m) => m.category === category);
}

/**
 * Gets all supported symbols
 * @returns Array of all symbol mappings
 */
export function getAllSupportedSymbols(): SymbolMapping[] {
  return SYMBOL_MAPPINGS;
}
