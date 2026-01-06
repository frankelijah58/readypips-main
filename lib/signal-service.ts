import yahooFinance from "yahoo-finance2";
import {
  SMA,
  EMA,
  RSI,
  MACD,
  BollingerBands,
  Stochastic,
  WilliamsR,
  ATR,
  ADX,
  CCI,
} from "technicalindicators";
import { getDatabase } from "./mongodb";
import { mapSymbolToYahoo, getAlternativeSymbols } from "./symbol-mapping";

export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: {
    MACD: number;
    signal: number;
    histogram: number;
  };
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
  stoch: {
    k: number;
    d: number;
  };
  williamsR: number;
  atr: number;
  adx: number;
  cci: number;
}

export interface SignalAnalysis {
  symbol: string;
  timeframe: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  price: number;
  target: number;
  stopLoss: number;
  indicators: TechnicalIndicators;
  reasoning: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  timestamp: Date;
}

export class SignalService {
  private static instance: SignalService;
  private symbols = [
    "frxXAUUSD",
    "GBPUSD=X",
    "USDJPY=X",
    "USDCHF=X",
    "AUDUSD=X",
    "USDCAD=X",
    "NZDUSD=X",
    "BTC-USD",
    "ETH-USD",
    "AAPL",
    "GOOGL",
    "MSFT",
    "TSLA",
    "AMZN",
    "META",
    "NVDA",
  ];
  private timeframes = ["1d"] as const; // Only use valid Yahoo Finance intervals: 1d, 1wk, 1mo

  private constructor() {}

  public static getInstance(): SignalService {
    if (!SignalService.instance) {
      SignalService.instance = new SignalService();
    }
    return SignalService.instance;
  }

  async getMarketData(
    symbol: string,
    interval: string,
    period: number = 100
  ): Promise<MarketData[]> {
    try {
      // Map the symbol to Yahoo Finance format
      const mappedSymbol = mapSymbolToYahoo(symbol);
      // console.log(`🔄 [Signal Service] Mapping ${symbol} to ${mappedSymbol}`);

      // Validate interval - only allow valid Yahoo Finance intervals
      const validIntervals = ["1d", "1wk", "1mo"];
      let validInterval = interval.toLowerCase();
      if (!validIntervals.includes(validInterval)) {
        console.warn(
          `⚠️ Invalid interval "${interval}" for ${mappedSymbol}, using "1d" instead`
        );
        validInterval = "1d";
      }

      // Calculate start date based on period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

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
          `📊 [Signal Service] Successfully fetched ${result.length} bars for ${mappedSymbol} (${validInterval} timeframe)`
        );
      } catch (error) {
        console.warn(
          `⚠️ [Signal Service] Primary symbol ${mappedSymbol} failed, trying alternatives...`
        );

        // Try alternative symbols
        const alternatives = getAlternativeSymbols(symbol);
        let success = false;

        for (const altSymbol of alternatives) {
          try {
            result = await yahooFinance.historical(altSymbol, queryOptions);
            usedSymbol = altSymbol;
            // console.log(
              `✅ [Signal Service] Successfully fetched ${result.length} bars using alternative symbol ${altSymbol}`
            );
            success = true;
            break;
          } catch (altError) {
            console.warn(
              `⚠️ [Signal Service] Alternative symbol ${altSymbol} also failed`
            );
            continue;
          }
        }

        if (!success) {
          console.error(`❌ [Signal Service] All symbols failed for ${symbol}`);
          return [];
        }
      }

      if (result.length === 0) {
        console.warn(`⚠️ [Signal Service] No data returned for ${usedSymbol}`);
        return [];
      }

      // console.log(
        `📊 Analyzed ${result.length} bars for ${usedSymbol} (${validInterval} timeframe)`
      );

      return result.map((candle) => ({
        symbol: usedSymbol,
        timestamp: candle.date.getTime(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume || 0,
      }));
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return [];
    }
  }

  calculateTechnicalIndicators(data: MarketData[]): TechnicalIndicators {
    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const volumes = data.map((d) => d.volume);

    // SMA calculations
    const sma20 = SMA.calculate({ period: 20, values: closes });
    const sma50 = SMA.calculate({ period: 50, values: closes });

    // EMA calculations
    const ema12 = EMA.calculate({ period: 12, values: closes });
    const ema26 = EMA.calculate({ period: 26, values: closes });

    // RSI
    const rsi = RSI.calculate({ period: 14, values: closes });

    // MACD
    const macd = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: closes,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });

    // Bollinger Bands
    const bb = BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2,
    });

    // Stochastic
    const stoch = Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
      signalPeriod: 3,
    });

    // Williams %R
    const williamsR = WilliamsR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });

    // ATR (Average True Range)
    const atr = ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });

    // ADX (Average Directional Index)
    const adx = ADX.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });

    // CCI (Commodity Channel Index)
    const cci = CCI.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 20,
    });

    // Get the latest values
    const latest = data.length - 1;

    return {
      sma20: sma20[sma20.length - 1] || 0,
      sma50: sma50[sma50.length - 1] || 0,
      ema12: ema12[ema12.length - 1] || 0,
      ema26: ema26[ema26.length - 1] || 0,
      rsi: rsi[rsi.length - 1] || 50,
      macd: {
        MACD: macd[macd.length - 1]?.MACD || 0,
        signal: macd[macd.length - 1]?.signal || 0,
        histogram: macd[macd.length - 1]?.histogram || 0,
      },
      bb: bb[bb.length - 1] || { upper: 0, middle: 0, lower: 0 },
      stoch: stoch[stoch.length - 1] || { k: 50, d: 50 },
      williamsR: williamsR[williamsR.length - 1] || -50,
      atr: atr[atr.length - 1] || 0,
      adx: adx[adx.length - 1]?.adx || 0,
      cci: cci[cci.length - 1] || 0,
    };
  }

  analyzeSignal(
    symbol: string,
    data: MarketData[],
    indicators: TechnicalIndicators
  ): SignalAnalysis {
    const currentPrice = data[data.length - 1].close;
    const reasoning: string[] = [];
    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
    let confidence = 0;
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";

    // RSI Analysis
    if (indicators.rsi < 30) {
      reasoning.push("RSI oversold (< 30) - potential buy signal");
      signal = "BUY";
      confidence += 15;
    } else if (indicators.rsi > 70) {
      reasoning.push("RSI overbought (> 70) - potential sell signal");
      signal = "SELL";
      confidence += 15;
    }

    // MACD Analysis
    if (
      indicators.macd.MACD > indicators.macd.signal &&
      indicators.macd.histogram > 0
    ) {
      reasoning.push("MACD bullish crossover");
      if (signal === "BUY") confidence += 10;
      else if (signal === "HOLD") {
        signal = "BUY";
        confidence += 10;
      }
    } else if (
      indicators.macd.MACD < indicators.macd.signal &&
      indicators.macd.histogram < 0
    ) {
      reasoning.push("MACD bearish crossover");
      if (signal === "SELL") confidence += 10;
      else if (signal === "HOLD") {
        signal = "SELL";
        confidence += 10;
      }
    }

    // Moving Average Analysis
    if (
      currentPrice > indicators.sma20 &&
      indicators.sma20 > indicators.sma50
    ) {
      reasoning.push("Price above SMA20 and SMA20 above SMA50 - bullish trend");
      if (signal === "BUY") confidence += 10;
      else if (signal === "HOLD") {
        signal = "BUY";
        confidence += 10;
      }
    } else if (
      currentPrice < indicators.sma20 &&
      indicators.sma20 < indicators.sma50
    ) {
      reasoning.push("Price below SMA20 and SMA20 below SMA50 - bearish trend");
      if (signal === "SELL") confidence += 10;
      else if (signal === "HOLD") {
        signal = "SELL";
        confidence += 10;
      }
    }

    // Bollinger Bands Analysis
    if (currentPrice < indicators.bb.lower) {
      reasoning.push("Price below lower Bollinger Band - potential reversal");
      if (signal === "BUY") confidence += 8;
      else if (signal === "HOLD") {
        signal = "BUY";
        confidence += 8;
      }
    } else if (currentPrice > indicators.bb.upper) {
      reasoning.push("Price above upper Bollinger Band - potential reversal");
      if (signal === "SELL") confidence += 8;
      else if (signal === "HOLD") {
        signal = "SELL";
        confidence += 8;
      }
    }

    // Stochastic Analysis
    if (indicators.stoch.k < 20 && indicators.stoch.d < 20) {
      reasoning.push("Stochastic oversold - potential buy signal");
      if (signal === "BUY") confidence += 7;
      else if (signal === "HOLD") {
        signal = "BUY";
        confidence += 7;
      }
    } else if (indicators.stoch.k > 80 && indicators.stoch.d > 80) {
      reasoning.push("Stochastic overbought - potential sell signal");
      if (signal === "SELL") confidence += 7;
      else if (signal === "HOLD") {
        signal = "SELL";
        confidence += 7;
      }
    }

    // Williams %R Analysis
    if (indicators.williamsR < -80) {
      reasoning.push("Williams %R oversold - potential buy signal");
      if (signal === "BUY") confidence += 5;
      else if (signal === "HOLD") {
        signal = "BUY";
        confidence += 5;
      }
    } else if (indicators.williamsR > -20) {
      reasoning.push("Williams %R overbought - potential sell signal");
      if (signal === "SELL") confidence += 5;
      else if (signal === "HOLD") {
        signal = "SELL";
        confidence += 5;
      }
    }

    // ADX Analysis (Trend Strength)
    if (indicators.adx > 25) {
      reasoning.push("Strong trend detected (ADX > 25)");
      confidence += 5;
    }

    // CCI Analysis
    if (indicators.cci > 100) {
      reasoning.push("CCI overbought - potential sell signal");
      if (signal === "SELL") confidence += 5;
      else if (signal === "HOLD") {
        signal = "SELL";
        confidence += 5;
      }
    } else if (indicators.cci < -100) {
      reasoning.push("CCI oversold - potential buy signal");
      if (signal === "BUY") confidence += 5;
      else if (signal === "HOLD") {
        signal = "BUY";
        confidence += 5;
      }
    }

    // Calculate target and stop loss
    const atr = indicators.atr;
    let target = currentPrice;
    let stopLoss = currentPrice;

    if (signal === "BUY") {
      target = currentPrice + atr * 2; // 2x ATR for target
      stopLoss = currentPrice - atr * 1.5; // 1.5x ATR for stop loss
    } else if (signal === "SELL") {
      target = currentPrice - atr * 2; // 2x ATR for target
      stopLoss = currentPrice + atr * 1.5; // 1.5x ATR for stop loss
    }

    // Determine risk level based on ATR and confidence
    if (atr > currentPrice * 0.05) {
      // High volatility
      riskLevel = "HIGH";
    } else if (atr > currentPrice * 0.02) {
      // Medium volatility
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }

    // Cap confidence at 95%
    confidence = Math.min(confidence, 95);

    return {
      symbol,
      timeframe: "1d", // Daily timeframe
      signal,
      confidence,
      price: currentPrice,
      target,
      stopLoss,
      indicators,
      reasoning,
      riskLevel,
      timestamp: new Date(),
    };
  }

  async generateSignals(): Promise<SignalAnalysis[]> {
    const signals: SignalAnalysis[] = [];
    let totalBarsAnalyzed = 0;

    // console.log(
      `🚀 Starting signal generation for ${this.symbols.length} symbols...`
    );

    for (const symbol of this.symbols) {
      try {
        // Get market data for different timeframes
        for (const timeframe of this.timeframes) {
          const marketData = await this.getMarketData(symbol, timeframe);
          totalBarsAnalyzed += marketData.length;

          if (marketData.length < 50) {
            // console.log(
              `⚠️  Insufficient data for ${symbol} (${timeframe}): ${marketData.length} bars, skipping...`
            );
            continue;
          }

          const indicators = this.calculateTechnicalIndicators(marketData);
          const analysis = this.analyzeSignal(symbol, marketData, indicators);

          // Only include high-confidence signals
          if (analysis.confidence >= 60) {
            signals.push(analysis);
            // console.log(
              `✅ Generated ${analysis.signal} signal for ${symbol} (${timeframe}) - Confidence: ${analysis.confidence}%`
            );
          }
        }
      } catch (error) {
        console.error(`Error generating signals for ${symbol}:`, error);
      }
    }

    // console.log(`📈 Signal generation complete!`);
    // console.log(`   • Total bars analyzed: ${totalBarsAnalyzed}`);
    // console.log(`   • Symbols processed: ${this.symbols.length}`);
    // console.log(`   • Timeframes per symbol: ${this.timeframes.length}`);
    // console.log(`   • High-confidence signals generated: ${signals.length}`);

    return signals;
  }

  async saveSignalsToDatabase(signals: SignalAnalysis[]): Promise<void> {
    try {
      const db = await getDatabase();
      const signalsCollection = db.collection("signals");

      for (const signal of signals) {
        const signalDoc = {
          symbol: signal.symbol,
          type: signal.signal,
          price: signal.price,
          target: signal.target,
          stopLoss: signal.stopLoss,
          confidence: signal.confidence,
          timeframe: signal.timeframe,
          description: signal.reasoning.join("; "),
          createdAt: signal.timestamp,
          isActive: true,
          riskLevel: signal.riskLevel,
          indicators: signal.indicators,
          reasoning: signal.reasoning,
        };

        await signalsCollection.insertOne(signalDoc);
      }

      // console.log(`Saved ${signals.length} signals to database`);
    } catch (error) {
      console.error("Error saving signals to database:", error);
    }
  }

  async startSignalGeneration(): Promise<void> {
    // console.log("Starting real signal generation service...");

    // Generate initial signals
    await this.generateAndSaveSignals();

    // Set up periodic signal generation (every 15 minutes)
    setInterval(async () => {
      await this.generateAndSaveSignals();
    }, 15 * 60 * 1000);
  }

  async generateAndSaveSignals(): Promise<void> {
    // console.log(`🎯 Initializing proprietary signal algorithm...`);
    const startTime = Date.now();

    try {
      const signals = await this.generateSignals();

      if (signals.length > 0) {
        await this.saveSignalsToDatabase(signals);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        // console.log(`🎉 Signal generation and saving completed successfully!`);
        // console.log(`   • Duration: ${duration.toFixed(2)} seconds`);
        // console.log(`   • Signals saved to database: ${signals.length}`);
      } else {
        // console.log(`📊 No high-confidence signals generated`);
      }
    } catch (error) {
      console.error("Error in generateAndSaveSignals:", error);
      throw error;
    }
  }
}
