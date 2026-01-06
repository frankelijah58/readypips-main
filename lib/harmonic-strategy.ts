import { readFileSync } from "fs";
import { join } from "path";

// Interface for the strategy
export interface HarmonicStrategy {
  analyze: (candles: any[]) => {
    signals: any[];
    patterns: any[];
    fibLevels: Record<string, number>;
    tradingState: any;
    zigzagPoints: any[];
  };
  reset: () => void;
}

// Load the Frank State Strategy from the public directory
export function loadHarmonicStrategy(config: any = {}): HarmonicStrategy {
  try {
    // Read the strategy file
    const strategyPath = join(
      process.cwd(),
      "public",
      "frank-state-strategy.js"
    );
    const strategyCode = readFileSync(strategyPath, "utf8");

    // Create a context to execute the strategy
    const context = {
      Math,
      console,
      module: { exports: {} },
      exports: {},
      require: () => ({}), // Mock require for Node.js compatibility
    };

    // Execute the strategy code
    const strategyFunction = new Function(
      "Math",
      "console",
      "module",
      "exports",
      "require",
      strategyCode
    );
    strategyFunction(
      context.Math,
      context.console,
      context.module,
      context.exports,
      context.require
    );

    // Get the HarmonicPatternStrategy class
    const HarmonicPatternStrategy = context.module.exports;

    if (!HarmonicPatternStrategy) {
      throw new Error("Failed to load HarmonicPatternStrategy");
    }

    // Create and return an instance
    if (
      typeof HarmonicPatternStrategy === "function" &&
      HarmonicPatternStrategy.prototype &&
      HarmonicPatternStrategy.prototype.constructor
    ) {
      return new (HarmonicPatternStrategy as any)(config);
    } else if (typeof HarmonicPatternStrategy === "function") {
      return HarmonicPatternStrategy(config);
    } else {
      throw new Error(
        "HarmonicPatternStrategy is not a constructable or callable function"
      );
    }
  } catch (error) {
    console.error("Error loading harmonic strategy:", error);

    // Fallback to a mock strategy
    return createMockStrategy();
  }
}

// Mock strategy for development/testing
function createMockStrategy(): HarmonicStrategy {
  return {
    analyze: (candles: any[]) => {
      const patterns = [];
      const fibLevels: Record<string, number> = {};

      if (candles.length >= 5) {
        const currentPrice = candles[candles.length - 1].close;

        // Calculate Fibonacci levels
        const high = Math.max(...candles.slice(-20).map((c: any) => c.high));
        const low = Math.min(...candles.slice(-20).map((c: any) => c.low));
        const range = high - low;

        fibLevels["0.000"] = low;
        fibLevels["0.236"] = low + range * 0.236;
        fibLevels["0.382"] = low + range * 0.382;
        fibLevels["0.500"] = low + range * 0.5;
        fibLevels["0.618"] = low + range * 0.618;
        fibLevels["0.764"] = low + range * 0.764;
        fibLevels["1.000"] = high;

        // Simulate pattern detection with realistic ratios
        const patternTypes = [
          {
            name: "Bat",
            ratios: { xab: 0.382, abc: 0.382, bcd: 2.618, xad: 0.886 },
          },
          {
            name: "Butterfly",
            ratios: { xab: 0.786, abc: 0.382, bcd: 2.618, xad: 1.618 },
          },
          {
            name: "Gartley",
            ratios: { xab: 0.618, abc: 0.382, bcd: 1.618, xad: 0.786 },
          },
          {
            name: "Crab",
            ratios: { xab: 0.618, abc: 0.382, bcd: 3.618, xad: 1.618 },
          },
          {
            name: "Shark",
            ratios: { xab: 0.886, abc: 1.13, bcd: 1.618, xad: 0.886 },
          },
          { name: "ABCD", ratios: { xab: 0, abc: 0.382, bcd: 1.618, xad: 0 } },
        ];

        // 30% chance of detecting a pattern
        if (Math.random() > 0.7) {
          const patternType =
            patternTypes[Math.floor(Math.random() * patternTypes.length)];
          const isBullish = Math.random() > 0.5;

          patterns.push({
            name: patternType.name,
            type: isBullish ? "bullish" : "bearish",
            ratios: patternType.ratios,
            points: {
              x: currentPrice * 0.98,
              a: currentPrice * 1.02,
              b: currentPrice * 0.99,
              c: currentPrice * 1.01,
              d: currentPrice,
            },
          });
        }
      }

      return {
        patterns,
        fibLevels,
        signals: [],
        tradingState: {
          inBuyTrade: false,
          inSellTrade: false,
          buyTpLevel: null,
          buySlLevel: null,
          sellTpLevel: null,
          sellSlLevel: null,
        },
        zigzagPoints: [],
      };
    },

    reset: () => {
      // Reset strategy state
      // console.log("Mock strategy reset");
    },
  };
}

// Utility function to calculate confidence based on pattern ratios
export function calculatePatternConfidence(pattern: any): number {
  const { ratios } = pattern;
  let confidence = 50; // Base confidence

  const idealRatios = {
    Bat: { xab: 0.382, abc: 0.382, bcd: 2.618, xad: 0.886 },
    Butterfly: { xab: 0.786, abc: 0.382, bcd: 2.618, xad: 1.618 },
    Gartley: { xab: 0.618, abc: 0.382, bcd: 1.618, xad: 0.786 },
    Crab: { xab: 0.618, abc: 0.382, bcd: 3.618, xad: 1.618 },
    Shark: { xab: 0.886, abc: 1.13, bcd: 1.618, xad: 0.886 },
    ABCD: { xab: 0, abc: 0.382, bcd: 1.618, xad: 0 },
  };

  const ideal = idealRatios[pattern.name as keyof typeof idealRatios];
  if (ideal) {
    const xabDiff = Math.abs(ratios.xab - ideal.xab) / (ideal.xab || 1);
    const abcDiff = Math.abs(ratios.abc - ideal.abc) / (ideal.abc || 1);
    const bcdDiff = Math.abs(ratios.bcd - ideal.bcd) / (ideal.bcd || 1);
    const xadDiff = Math.abs(ratios.xad - ideal.xad) / (ideal.xad || 1);

    const avgDiff = (xabDiff + abcDiff + bcdDiff + xadDiff) / 4;
    confidence = Math.max(30, Math.min(95, 100 - avgDiff * 100));
  }

  return Math.round(confidence);
}

// Convert strategy results to our standard format
export function convertStrategyResults(analysis: any, candles: any[]) {
  const currentPrice = candles[candles.length - 1].close;

  const patterns = analysis.patterns.map((pattern: any) => ({
    name: pattern.name,
    type: pattern.type,
    confidence: calculatePatternConfidence(pattern),
    entryPrice: analysis.fibLevels["0.382"] || currentPrice,
    targetPrice: analysis.fibLevels["0.618"] || currentPrice * 1.02,
    stopLoss: analysis.fibLevels["-0.618"] || currentPrice * 0.98,
    ratios: pattern.ratios,
    points: pattern.points,
  }));

  return {
    patterns,
    fibLevels: analysis.fibLevels,
    signals: analysis.signals,
    tradingState: analysis.tradingState,
  };
}
