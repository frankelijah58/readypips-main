// Simple in-memory caching system to avoid SQLite native binding issues
interface CacheItem {
  data: any;
  timestamp: number;
}

interface CacheStore {
  [key: string]: CacheItem;
}

// In-memory cache stores
const marketDataCache: CacheStore = {};
const aiInsightsCache: CacheStore = {};
const newsCache: { [symbol: string]: CacheItem[] } = {};

// Cache expiration times (in milliseconds)
const CACHE_TIMES = {
  marketData: 5 * 60 * 1000, // 5 minutes
  aiInsights: 30 * 60 * 1000, // 30 minutes
  news: 60 * 60 * 1000, // 60 minutes
};

// Helper function to check if cache is valid
function isCacheValid(timestamp: number, maxAge: number): boolean {
  return Date.now() - timestamp < maxAge;
}

// Market data caching
export async function cacheMarketData(symbol: string, data: any) {
  marketDataCache[symbol] = {
    data,
    timestamp: Date.now(),
  };
}

export async function getCachedMarketData(
  symbol: string,
  maxAgeMinutes: number = 5
) {
  const cacheKey = symbol;
  const cached = marketDataCache[cacheKey];

  if (cached && isCacheValid(cached.timestamp, maxAgeMinutes * 60 * 1000)) {
    return cached.data;
  }

  // Remove expired cache
  if (cached) {
    delete marketDataCache[cacheKey];
  }

  return null;
}

// AI insights caching
export async function cacheAIInsights(symbol: string, insights: any) {
  aiInsightsCache[symbol] = {
    data: insights,
    timestamp: Date.now(),
  };
}

export async function getCachedAIInsights(
  symbol: string,
  maxAgeMinutes: number = 30
) {
  const cacheKey = symbol;
  const cached = aiInsightsCache[cacheKey];

  if (cached && isCacheValid(cached.timestamp, maxAgeMinutes * 60 * 1000)) {
    return cached.data;
  }

  // Remove expired cache
  if (cached) {
    delete aiInsightsCache[cacheKey];
  }

  return null;
}

// News caching
export async function cacheNews(symbol: string, newsItems: any[]) {
  newsCache[symbol] = newsItems.map((item) => ({
    data: item,
    timestamp: Date.now(),
  }));
}

export async function getCachedNews(
  symbol: string,
  maxAgeMinutes: number = 60
) {
  const cached = newsCache[symbol];

  if (cached && cached.length > 0) {
    // Check if any items are still valid
    const validItems = cached.filter((item) =>
      isCacheValid(item.timestamp, maxAgeMinutes * 60 * 1000)
    );

    if (validItems.length > 0) {
      return validItems.map((item) => item.data);
    }
  }

  // Remove expired cache
  if (cached) {
    delete newsCache[symbol];
  }

  return null;
}

// Clean up old cache entries
export async function cleanupCache() {
  const now = Date.now();

  // Clean market data cache
  Object.keys(marketDataCache).forEach((key) => {
    if (!isCacheValid(marketDataCache[key].timestamp, CACHE_TIMES.marketData)) {
      delete marketDataCache[key];
    }
  });

  // Clean AI insights cache
  Object.keys(aiInsightsCache).forEach((key) => {
    if (!isCacheValid(aiInsightsCache[key].timestamp, CACHE_TIMES.aiInsights)) {
      delete aiInsightsCache[key];
    }
  });

  // Clean news cache
  Object.keys(newsCache).forEach((symbol) => {
    const validItems = newsCache[symbol].filter((item) =>
      isCacheValid(item.timestamp, CACHE_TIMES.news)
    );

    if (validItems.length === 0) {
      delete newsCache[symbol];
    } else {
      newsCache[symbol] = validItems;
    }
  });
}

// Close database connection (no-op for in-memory cache)
export async function closeDatabase() {
  // Nothing to do for in-memory cache
}
