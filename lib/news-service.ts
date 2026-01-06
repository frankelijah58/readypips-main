import { getDatabase } from "./mongodb";

export interface NewsItem {
  _id?: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  category:
    | "CPI"
    | "NFP"
    | "FOMC"
    | "GDP"
    | "ECONOMIC"
    | "MARKET"
    | "POLITICAL";
  impact: "HIGH" | "MEDIUM" | "LOW";
  symbols: string[]; // Affected symbols
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  sentimentScore: number; // -1 to 1 scale
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EconomicEvent {
  _id?: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  country: string;
  currency: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  previous: string;
  forecast: string;
  actual?: string;
  category:
    | "CPI"
    | "NFP"
    | "FOMC"
    | "GDP"
    | "INTEREST_RATE"
    | "UNEMPLOYMENT"
    | "RETAIL_SALES"
    | "OTHER";
  symbols: string[];
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NewsService {
  private static instance: NewsService;
  private alphaVantageApiKey: string;

  private constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || "";
  }

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  // Simple NLP-based sentiment analysis
  private analyzeSentiment(text: string): {
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    score: number;
  } {
    const positiveWords = [
      "bullish",
      "surge",
      "rally",
      "gain",
      "rise",
      "up",
      "positive",
      "strong",
      "beat",
      "exceed",
      "growth",
      "profit",
      "earnings",
      "recovery",
      "optimistic",
      "confidence",
      "boost",
      "higher",
      "increase",
      "improve",
      "success",
      "win",
      "victory",
      "breakthrough",
      "milestone",
      "record",
    ];

    const negativeWords = [
      "bearish",
      "crash",
      "plunge",
      "drop",
      "fall",
      "down",
      "negative",
      "weak",
      "miss",
      "below",
      "decline",
      "loss",
      "deficit",
      "recession",
      "pessimistic",
      "fear",
      "concern",
      "lower",
      "decrease",
      "worse",
      "failure",
      "loss",
      "defeat",
      "crisis",
      "problem",
      "risk",
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = words.length;
    const positiveRatio = positiveCount / total;
    const negativeRatio = negativeCount / total;
    const score = positiveRatio - negativeRatio;

    if (score > 0.02)
      return { sentiment: "POSITIVE", score: Math.min(score, 1) };
    if (score < -0.02)
      return { sentiment: "NEGATIVE", score: Math.max(score, -1) };
    return { sentiment: "NEUTRAL", score: 0 };
  }

  // Categorize news based on keywords
  private categorizeNews(
    title: string,
    content: string
  ): "CPI" | "NFP" | "FOMC" | "GDP" | "ECONOMIC" | "MARKET" | "POLITICAL" {
    const text = (title + " " + content).toLowerCase();

    if (
      text.includes("cpi") ||
      text.includes("consumer price index") ||
      text.includes("inflation")
    ) {
      return "CPI";
    }
    if (
      text.includes("nfp") ||
      text.includes("non-farm payrolls") ||
      text.includes("employment") ||
      text.includes("jobs")
    ) {
      return "NFP";
    }
    if (
      text.includes("fomc") ||
      text.includes("federal reserve") ||
      text.includes("fed") ||
      text.includes("interest rate")
    ) {
      return "FOMC";
    }
    if (
      text.includes("gdp") ||
      text.includes("gross domestic product") ||
      text.includes("economic growth")
    ) {
      return "GDP";
    }
    if (
      text.includes("political") ||
      text.includes("election") ||
      text.includes("government") ||
      text.includes("policy")
    ) {
      return "POLITICAL";
    }
    if (
      text.includes("forex") ||
      text.includes("currency") ||
      text.includes("trading") ||
      text.includes("market")
    ) {
      return "MARKET";
    }
    return "ECONOMIC";
  }

  // Determine impact based on source and content
  private determineImpact(
    source: string,
    title: string
  ): "HIGH" | "MEDIUM" | "LOW" {
    const highImpactSources = [
      "reuters",
      "bloomberg",
      "cnbc",
      "marketwatch",
      "wsj",
    ];
    const text = title.toLowerCase();

    // High impact keywords
    const highImpactKeywords = [
      "cpi",
      "nfp",
      "fomc",
      "gdp",
      "fed",
      "federal reserve",
      "interest rate",
    ];
    const hasHighImpactKeyword = highImpactKeywords.some((keyword) =>
      text.includes(keyword)
    );

    if (
      hasHighImpactKeyword ||
      highImpactSources.includes(source.toLowerCase())
    ) {
      return "HIGH";
    }

    // Medium impact keywords
    const mediumImpactKeywords = [
      "employment",
      "inflation",
      "economic",
      "trading",
      "forex",
    ];
    const hasMediumImpactKeyword = mediumImpactKeywords.some((keyword) =>
      text.includes(keyword)
    );

    if (hasMediumImpactKeyword) {
      return "MEDIUM";
    }

    return "LOW";
  }

  // Extract symbols from news content
  private extractSymbols(title: string, content: string): string[] {
    const text = (title + " " + content).toUpperCase();
    const symbols: string[] = [];

    // Forex pairs
    const forexPatterns = [
      /EUR\/USD/g,
      /GBP\/USD/g,
      /USD\/JPY/g,
      /USD\/CHF/g,
      /AUD\/USD/g,
      /USD\/CAD/g,
      /NZD\/USD/g,
      /EURUSD/g,
      /GBPUSD/g,
      /USDJPY/g,
      /USDCHF/g,
      /AUDUSD/g,
      /USDCAD/g,
      /NZDUSD/g,
    ];

    forexPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          if (!symbols.includes(match)) symbols.push(match);
        });
      }
    });

    // Stock symbols
    const stockPatterns = [
      /AAPL/g,
      /GOOGL/g,
      /MSFT/g,
      /TSLA/g,
      /AMZN/g,
      /META/g,
      /NVDA/g,
      /SPY/g,
      /QQQ/g,
    ];

    stockPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          if (!symbols.includes(match)) symbols.push(match);
        });
      }
    });

    return symbols.slice(0, 5); // Limit to 5 symbols
  }

  async fetchMarketNews(): Promise<NewsItem[]> {
    try {
      // console.log("📰 Fetching market news from Alpha Vantage...");

      if (!this.alphaVantageApiKey) {
        console.warn("⚠️ No Alpha Vantage API key found, using mock data");
        return this.getMockNews();
      }

      // Use the NEWS_SENTIMENT endpoint with proper parameters
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL,GOOGL,MSFT,TSLA,AMZN,META,NVDA&topics=technology,financial_markets,economy_macro&limit=50&apikey=${this.alphaVantageApiKey}`;

      // console.log("🔗 Fetching from:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // console.log("📊 Alpha Vantage response:", JSON.stringify(data, null, 2));

      // Check for API errors
      if (data["Error Message"]) {
        throw new Error(`Alpha Vantage API Error: ${data["Error Message"]}`);
      }

      if (data["Note"]) {
        console.warn("⚠️ Alpha Vantage API limit reached:", data["Note"]);
        return this.getMockNews();
      }

      // Check if we have the expected data structure
      if (!data.feed || !Array.isArray(data.feed)) {
        console.warn(
          "⚠️ Unexpected response format from Alpha Vantage, using mock data"
        );
        return this.getMockNews();
      }

      const articles = data.feed;
      // console.log(`📰 Found ${articles.length} articles from Alpha Vantage`);

      if (articles.length === 0) {
        console.warn("⚠️ No articles found, using mock data");
        return this.getMockNews();
      }

      const processedArticles: NewsItem[] = articles.map(
        (article: any, index: number) => {
          // console.log(
            `📰 Processing article ${index + 1}: ${article.title}...`
          );

          const sentiment = this.analyzeSentiment(
            article.title + " " + (article.summary || "")
          );
          const category = this.categorizeNews(
            article.title,
            article.summary || ""
          );
          const impact = this.determineImpact(article.source, article.title);
          const symbols = this.extractSymbols(
            article.title,
            article.summary || ""
          );

          const processedArticle: NewsItem = {
            title: article.title || "No Title",
            content: article.summary || article.title || "No content available",
            summary: article.summary || article.title || "No summary available",
            source: article.source || "Unknown Source",
            url: article.url || "#",
            publishedAt: new Date(article.time_published || Date.now()),
            category,
            impact,
            symbols,
            sentiment: sentiment.sentiment,
            sentimentScore: sentiment.score,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // console.log(`📰 Processed article ${index + 1}:`, {
            title: processedArticle.title,
            category: processedArticle.category,
            impact: processedArticle.impact,
            sentiment: processedArticle.sentiment,
            sentimentScore: processedArticle.sentimentScore,
            symbols: processedArticle.symbols,
          });

          return processedArticle;
        }
      );

      // console.log(
        `✅ Successfully processed ${processedArticles.length} news articles`
      );
      return processedArticles;
    } catch (error) {
      console.error("❌ Error fetching market news:", error);
      // console.log("🔄 Falling back to mock data...");
      return this.getMockNews();
    }
  }

  // Fallback mock news
  private getMockNews(): NewsItem[] {
    const mockNews: NewsItem[] = [
      {
        title: "CPI Data Shows Inflation Cooling to 3.1%",
        content:
          "The Consumer Price Index (CPI) for December showed inflation cooling to 3.1% year-over-year, down from 3.4% in November. This marks the third consecutive month of declining inflation, suggesting the Federal Reserve's monetary policy is having the desired effect.",
        summary:
          "December CPI shows inflation cooling to 3.1%, supporting Fed's dovish stance",
        source: "Reuters",
        url: "https://example.com/cpi-data",
        publishedAt: new Date(),
        category: "CPI",
        impact: "HIGH",
        symbols: ["frxXAUUSD", "GBPUSD=X", "USDJPY=X", "DXY"],
        sentiment: "POSITIVE",
        sentimentScore: 0.3,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Non-Farm Payrolls Beat Expectations with 216K Jobs Added",
        content:
          "The US economy added 216,000 jobs in December, beating expectations of 170,000. The unemployment rate held steady at 3.7%, while average hourly earnings rose 0.4% month-over-month and 4.1% year-over-year.",
        summary:
          "NFP beats expectations with 216K jobs, unemployment steady at 3.7%",
        source: "Bloomberg",
        url: "https://example.com/nfp-data",
        publishedAt: new Date(),
        category: "NFP",
        impact: "HIGH",
        symbols: ["frxXAUUSD", "GBPUSD=X", "USDJPY=X", "SPY", "QQQ"],
        sentiment: "POSITIVE",
        sentimentScore: 0.4,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return mockNews;
  }

  async fetchEconomicCalendar(): Promise<EconomicEvent[]> {
    try {
      if (!this.alphaVantageApiKey) {
        console.error("Alpha Vantage API key not found");
        return this.getMockEconomicEvents();
      }

      // console.log("📅 Fetching economic calendar from Alpha Vantage...");

      // Note: Alpha Vantage doesn't have a direct economic calendar endpoint
      // We'll use mock data for now, but you could integrate with other APIs like:
      // - Investing.com API
      // - FXStreet API
      // - Bloomberg API

      return this.getMockEconomicEvents();
    } catch (error) {
      console.error("Error fetching economic calendar:", error);
      return this.getMockEconomicEvents();
    }
  }

  private getMockEconomicEvents(): EconomicEvent[] {
    const mockEvents: EconomicEvent[] = [
      {
        title: "CPI (YoY)",
        description: "Consumer Price Index year-over-year change",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        time: "13:30",
        country: "US",
        currency: "USD",
        impact: "HIGH",
        previous: "3.1%",
        forecast: "3.0%",
        category: "CPI",
        symbols: ["frxXAUUSD", "GBPUSD=X", "USDJPY=X", "DXY"],
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Non-Farm Payrolls",
        description:
          "Change in number of employed people during the previous month",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        time: "13:30",
        country: "US",
        currency: "USD",
        impact: "HIGH",
        previous: "216K",
        forecast: "175K",
        category: "NFP",
        symbols: ["frxXAUUSD", "GBPUSD=X", "USDJPY=X", "SPY"],
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "FOMC Interest Rate Decision",
        description:
          "Federal Reserve interest rate decision and press conference",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        time: "19:00",
        country: "US",
        currency: "USD",
        impact: "HIGH",
        previous: "5.50%",
        forecast: "5.50%",
        category: "INTEREST_RATE",
        symbols: ["frxXAUUSD", "GBPUSD=X", "USDJPY=X", "TLT", "SPY"],
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return mockEvents;
  }

  async saveNewsToDatabase(news: NewsItem[]): Promise<void> {
    try {
      // console.log(`💾 Saving ${news.length} news articles to database...`);
      const db = await getDatabase();
      const newsCollection = db.collection("news");

      // Clear old news (older than 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const deleteResult = await newsCollection.deleteMany({
        createdAt: { $lt: weekAgo },
      });
      // console.log(`🗑️ Deleted ${deleteResult.deletedCount} old news articles`);

      // Insert new news (remove _id field to let MongoDB generate it)
      if (news.length > 0) {
        const newsToInsert = news.map((item) => {
          const { _id, ...itemWithoutId } = item;
          return itemWithoutId;
        });

        const insertResult = await newsCollection.insertMany(newsToInsert);
        // console.log(
          `✅ Successfully saved ${insertResult.insertedCount} news articles to database`
        );
      } else {
        // console.log("📰 No news articles to save");
      }
    } catch (error) {
      console.error("❌ Error saving news to database:", error);
    }
  }

  async saveEconomicEventsToDatabase(events: EconomicEvent[]): Promise<void> {
    try {
      const db = await getDatabase();
      const eventsCollection = db.collection("economic_events");

      // Clear old completed events (older than 30 days)
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      await eventsCollection.deleteMany({
        date: { $lt: monthAgo },
        isCompleted: true,
      });

      // Insert new events (remove _id field to let MongoDB generate it)
      if (events.length > 0) {
        const eventsToInsert = events.map((event) => {
          const { _id, ...eventWithoutId } = event;
          return eventWithoutId;
        });
        await eventsCollection.insertMany(eventsToInsert as any);
        // console.log(`📅 Saved ${events.length} economic events to database`);
      }
    } catch (error) {
      console.error("Error saving economic events to database:", error);
    }
  }

  async getNewsFromDatabase(limit: number = 50): Promise<NewsItem[]> {
    try {
      // console.log(`📰 Fetching up to ${limit} news articles from database...`);
      const db = await getDatabase();
      const newsCollection = db.collection("news");

      const news = await newsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      // console.log(`📰 Retrieved ${news.length} news articles from database`);
      if (news.length > 0) {
        // console.log("📰 First article from database:", news[0].title);
      }

      return news as any as NewsItem[];
    } catch (error) {
      console.error("❌ Error fetching news from database:", error);
      return [];
    }
  }

  async getEconomicEventsFromDatabase(
    limit: number = 50
  ): Promise<EconomicEvent[]> {
    try {
      const db = await getDatabase();
      const eventsCollection = db.collection("economic_events");

      const events = await eventsCollection
        .find({})
        .sort({ date: 1 })
        .limit(limit)
        .toArray();

      return events as any as EconomicEvent[];
    } catch (error) {
      console.error("Error fetching economic events from database:", error);
      return [];
    }
  }

  async markNewsAsRead(newsId: string): Promise<void> {
    try {
      const db = await getDatabase();
      const newsCollection = db.collection("news");

      await newsCollection.updateOne(
        { _id: newsId as any },
        { $set: { isRead: true, updatedAt: new Date() } }
      );
    } catch (error) {
      console.error("Error marking news as read:", error);
    }
  }

  async updateEconomicEventResult(
    eventId: string,
    actual: string
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const eventsCollection = db.collection("economic_events");

      await eventsCollection.updateOne(
        { _id: eventId as any },
        {
          $set: {
            actual,
            isCompleted: true,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error("Error updating economic event result:", error);
    }
  }
}
