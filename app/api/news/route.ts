import { NextRequest, NextResponse } from "next/server";
import { getCachedNews, cacheNews } from "@/lib/database";
import { mapSymbolToYahoo } from "@/lib/symbol-mapping";

// Alpha Vantage News API
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_NEWS_URL = "https://www.alphavantage.co/query";

// Fallback to NewsAPI if Alpha Vantage key not available
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = "https://newsapi.org/v2/everything";

interface AlphaVantageNewsResponse {
  feed: Array<{
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: Array<{
      topic: string;
      relevance_score: string;
    }>;
    overall_sentiment_score: number;
    overall_sentiment_label: string;
  }>;
  items: number;
  sentiment_score_definition: string;
  relevance_score_definition: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: {
      id: string;
      name: string;
    };
    author: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    content: string;
  }>;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: "positive" | "negative" | "neutral";
  relevance: "high" | "medium" | "low";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  // console.log(`📰 News API called for symbol: ${symbol}`);

  if (!symbol) {
    // console.log("❌ No symbol provided for news");
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  if (!ALPHA_VANTAGE_API_KEY && !NEWS_API_KEY) {
    // console.log("⚠️ No API keys configured, using mock news data");
    return NextResponse.json(generateMockNews(symbol));
  }

  try {
    // Convert symbol to appropriate format for news search
    const searchSymbol = mapSymbolToYahoo(symbol).replace(/[=XF]/g, ""); // Remove Yahoo Finance suffixes
    // console.log(`🔄 Using search symbol: ${searchSymbol} for news`);

    // Check cache first
    const cachedNews = await getCachedNews(symbol, 60); // 60 minutes cache
    if (cachedNews) {
      console.log(
        `✅ Returning cached news for ${symbol}:`,
        cachedNews.length,
        "articles"
      );
      return NextResponse.json(cachedNews);
    }

    // Try Alpha Vantage first if API key is available
    if (ALPHA_VANTAGE_API_KEY) {
      try {
        // console.log(`🌐 Trying Alpha Vantage news for ${searchSymbol}`);
        const alphaUrl = `${ALPHA_VANTAGE_NEWS_URL}?function=NEWS_SENTIMENT&tickers=${searchSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;

        const alphaResponse = await fetch(alphaUrl);
        const alphaData: AlphaVantageNewsResponse = await alphaResponse.json();

        if (alphaData.feed && alphaData.feed.length > 0) {
          console.log(
            `✅ Alpha Vantage returned ${alphaData.feed.length} articles for ${searchSymbol}`
          );

          const newsItems: NewsItem[] = alphaData.feed
            .slice(0, 5)
            .map((article, index) => ({
              id: `alpha-${index}`,
              title: article.title,
              summary: article.summary || "No summary available",
              url: article.url,
              publishedAt: article.time_published,
              source: article.source,
              sentiment: mapSentiment(article.overall_sentiment_label),
              relevance: "high" as const,
            }));

          await cacheNews(symbol, newsItems);
          return NextResponse.json(newsItems);
        }
      } catch (alphaError) {
        console.log(
          `❌ Alpha Vantage failed for ${searchSymbol}, trying NewsAPI`
        );
      }
    }

    // Fallback to NewsAPI if Alpha Vantage fails or no key
    if (NEWS_API_KEY) {
      const url = `${NEWS_API_BASE_URL}?q=${searchSymbol}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
      // console.log(
      //   `🌐 Fetching news from NewsAPI: ${url.replace(NEWS_API_KEY, "***")}`
      // );

      const response = await fetch(url);
      const data: NewsAPIResponse = await response.json();

      if (data.status === "ok" && data.articles && data.articles.length > 0) {
        // console.log(
        //   `✅ NewsAPI returned ${data.articles.length} articles for ${searchSymbol}`
        // );

        const newsItems: NewsItem[] = data.articles
          .slice(0, 5)
          .map((article, index) => ({
            id: `news-${index}`,
            title: article.title,
            summary:
              article.description ||
              article.content?.substring(0, 150) + "..." ||
              "No summary available",
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source.name,
            sentiment: getSentimentFromTitle(article.title),
            relevance: "high" as const,
          }));

        await cacheNews(symbol, newsItems);
        return NextResponse.json(newsItems);
      }
    }

    // If both APIs fail, return mock data
    // console.log(`❌ No news found for ${symbol}, returning mock data`);
    return NextResponse.json(generateMockNews(symbol));
  } catch (error) {
    console.error(`❌ Error fetching news for ${symbol}:`, error);

    // Fallback to mock data on error
    // console.log(`🔄 Falling back to mock news for ${symbol} due to error`);
    const mockNewsItems: NewsItem[] = [
      {
        id: "mock-1",
        title: `${symbol} Shows Strong Performance in Recent Trading Session`,
        summary: `${symbol} has demonstrated robust performance with increased trading volume and positive momentum indicators. Analysts are optimistic about the stock's future prospects.`,
        url: "#",
        publishedAt: new Date().toISOString(),
        source: "MarketWatch",
        sentiment: "positive" as const,
        relevance: "high" as const,
      },
      {
        id: "mock-2",
        title: "Market Analysis: Technology Sector Continues Growth Trend",
        summary:
          "The technology sector, including major players like AAPL, MSFT, and GOOGL, continues to show strong growth patterns with increasing institutional interest.",
        url: "#",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "Reuters",
        sentiment: "positive" as const,
        relevance: "medium" as const,
      },
      {
        id: "mock-3",
        title: "Federal Reserve Policy Impact on Market Sentiment",
        summary:
          "Recent Federal Reserve announcements have influenced market sentiment across various sectors, with investors closely monitoring policy changes.",
        url: "#",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: "Bloomberg",
        sentiment: "neutral" as const,
        relevance: "high" as const,
      },
      {
        id: "mock-4",
        title: "Earnings Season Brings Mixed Results for Tech Companies",
        summary:
          "The current earnings season has revealed mixed results across the technology sector, with some companies exceeding expectations while others face challenges.",
        url: "#",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: "CNBC",
        sentiment: "neutral" as const,
        relevance: "medium" as const,
      },
      {
        id: "mock-5",
        title: "Global Economic Indicators Point to Continued Volatility",
        summary:
          "Recent economic indicators suggest continued market volatility as investors navigate uncertain economic conditions and geopolitical factors.",
        url: "#",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: "Financial Times",
        sentiment: "negative" as const,
        relevance: "high" as const,
      },
    ];

    // console.log(
    //   `✅ Returning error fallback mock news for ${symbol}:`,
    //   mockNewsItems.length,
    //   "articles"
    // );
    return NextResponse.json(mockNewsItems);
  }
}

// Simple sentiment analysis based on keywords in title
function getSentimentFromTitle(
  title: string
): "positive" | "negative" | "neutral" {
  const positiveWords = [
    "surge",
    "jump",
    "rise",
    "gain",
    "up",
    "positive",
    "strong",
    "growth",
    "profit",
    "beat",
    "exceed",
  ];
  const negativeWords = [
    "fall",
    "drop",
    "decline",
    "down",
    "negative",
    "weak",
    "loss",
    "miss",
    "crash",
    "plunge",
  ];

  const lowerTitle = title.toLowerCase();

  const positiveCount = positiveWords.filter((word) =>
    lowerTitle.includes(word)
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    lowerTitle.includes(word)
  ).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

// Map Alpha Vantage sentiment to our format
function mapSentiment(sentiment: string): "positive" | "negative" | "neutral" {
  switch (sentiment.toLowerCase()) {
    case "positive":
    case "bullish":
      return "positive";
    case "negative":
    case "bearish":
      return "negative";
    default:
      return "neutral";
  }
}

// Generate mock news data
function generateMockNews(symbol: string): NewsItem[] {
  return [
    {
      id: "mock-1",
      title: `${symbol} Shows Strong Performance in Recent Trading Session`,
      summary: `${symbol} has demonstrated robust performance with increased trading volume and positive momentum indicators. Analysts are optimistic about the stock's future prospects.`,
      url: "#",
      publishedAt: new Date().toISOString(),
      source: "MarketWatch",
      sentiment: "positive" as const,
      relevance: "high" as const,
    },
    {
      id: "mock-2",
      title: "Market Analysis: Technology Sector Continues Growth Trend",
      summary:
        "The technology sector, including major players like AAPL, MSFT, and GOOGL, continues to show strong growth patterns with increasing institutional interest.",
      url: "#",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: "Reuters",
      sentiment: "positive" as const,
      relevance: "medium" as const,
    },
    {
      id: "mock-3",
      title: "Federal Reserve Policy Impact on Market Sentiment",
      summary:
        "Recent Federal Reserve announcements have influenced market sentiment across various sectors, with investors closely monitoring policy changes.",
      url: "#",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: "Bloomberg",
      sentiment: "neutral" as const,
      relevance: "high" as const,
    },
    {
      id: "mock-4",
      title: "Earnings Season Brings Mixed Results for Tech Companies",
      summary:
        "The current earnings season has revealed mixed results across the technology sector, with some companies exceeding expectations while others face challenges.",
      url: "#",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: "CNBC",
      sentiment: "neutral" as const,
      relevance: "medium" as const,
    },
    {
      id: "mock-5",
      title: "Global Economic Indicators Point to Continued Volatility",
      summary:
        "Recent economic indicators suggest continued market volatility as investors navigate uncertain economic conditions and geopolitical factors.",
      url: "#",
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      source: "Financial Times",
      sentiment: "negative" as const,
      relevance: "high" as const,
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const { newsId } = await request.json();

    if (!newsId) {
      return NextResponse.json(
        { error: "News ID is required" },
        { status: 400 }
      );
    }

    // The NewsService class and its methods are no longer used in this file
    // as the news data source is now NewsAPI.org.
    // Keeping the POST endpoint structure but it will not have an effect
    // on the news data itself, as the data is now statically generated.
    // If the intent was to mark news as read in a persistent way,
    // this would require a backend service or a different data source.
    // For now, we'll just return a success message.
    // console.log(`📝 POST request received for newsId: ${newsId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking news as read:", error);
    return NextResponse.json(
      { error: "Failed to mark news as read" },
      { status: 500 }
    );
  }
}
