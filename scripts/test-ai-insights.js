#!/usr/bin/env node

/**
 * Test script for AI Insights API
 * Tests the Gemini integration for market analysis
 */

const BASE_URL = "http://localhost:3000";

// Sample market data for testing
const testData = {
  symbol: "EURUSD",
  marketData: {
    symbol: "EURUSD",
    price: 1.0950,
    change: 0.0025,
    changePercent: 0.23,
    volume: 2500000,
    high: 1.0965,
    low: 1.0920,
    open: 1.0925,
  },
  primaryIndicators: {
    sma_20: 1.0945,
    sma_50: 1.0920,
    ema_12: 1.0948,
    ema_26: 1.0935,
    rsi: 65,
    macd: 0.0015,
    macd_signal: 0.0012,
    bollinger_upper: 1.0980,
    bollinger_lower: 1.0910,
    bollinger_middle: 1.0945,
  },
  allBarsData: {
    "1H": [
      {
        time: "2025-10-16 12:00",
        open: 1.0925,
        high: 1.0965,
        low: 1.0920,
        close: 1.0950,
        volume: 250000,
      },
      {
        time: "2025-10-16 11:00",
        open: 1.0920,
        high: 1.0945,
        low: 1.0910,
        close: 1.0925,
        volume: 240000,
      },
      {
        time: "2025-10-16 10:00",
        open: 1.0910,
        high: 1.0930,
        low: 1.0900,
        close: 1.0920,
        volume: 235000,
      },
    ],
    "4H": [
      {
        time: "2025-10-16 12:00",
        open: 1.0890,
        high: 1.0965,
        low: 1.0880,
        close: 1.0950,
        volume: 900000,
      },
      {
        time: "2025-10-16 08:00",
        open: 1.0875,
        high: 1.0910,
        low: 1.0870,
        close: 1.0890,
        volume: 850000,
      },
    ],
  },
  allIndicators: {
    "1H": {
      sma_20: 1.0945,
      sma_50: 1.0920,
      ema_12: 1.0948,
      ema_26: 1.0935,
      rsi: 65,
      macd: 0.0015,
      macd_signal: 0.0012,
      bollinger_upper: 1.0980,
      bollinger_lower: 1.0910,
      bollinger_middle: 1.0945,
    },
    "4H": {
      sma_20: 1.0930,
      sma_50: 1.0905,
      ema_12: 1.0935,
      ema_26: 1.0920,
      rsi: 62,
      macd: 0.0018,
      macd_signal: 0.0015,
      bollinger_upper: 1.0975,
      bollinger_lower: 1.0885,
      bollinger_middle: 1.0930,
    },
  },
  timeframes: ["1H", "4H"],
  primaryTimeframe: "1H",
  analysisContext: {
    strategy: "Harmonic Pattern Trading",
    strategyDescription:
      "Trade using harmonic patterns like ABCD, Gartley, and Butterfly patterns",
    selectedTimeframes: ["1H", "4H"],
  },
};

async function testAIInsights() {
  // console.log("\n📊 ========================================");
  // console.log("   AI INSIGHTS API TEST");
  // console.log("   ========================================\n");

  // console.log(`🔍 Testing AI Insights API at ${BASE_URL}/api/ai-insights\n`);

  try {
    // console.log("📤 Sending analysis request...\n");
    // console.log("Request Data Summary:");
    // console.log(`  - Symbol: ${testData.symbol}`);
    // console.log(`  - Strategy: ${testData.analysisContext.strategy}`);
    // console.log(`  - Primary Timeframe: ${testData.primaryTimeframe}`);
    // console.log(`  - Additional Timeframes: ${testData.timeframes.slice(1).join(", ")}`);
    // console.log(`  - Current Price: $${testData.marketData.price}`);
    // console.log(`  - RSI: ${testData.primaryIndicators.rsi}`);
    // console.log(`\n`);

    const response = await fetch(`${BASE_URL}/api/ai-insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status}`);
      console.error(`📋 Response: ${errorText}`);
      return;
    }

    const result = await response.json();

    // console.log("✅ Analysis received successfully!\n");
    // console.log("Response Structure:");
    // console.log(`  - MongoDB ID: ${result._id}`);
    // console.log(`  - Public ID: ${result.publicId}`);
    // console.log(`  - Symbol: ${result.symbol}`);
    // console.log(`  - Timeframe/Strategy: ${result.timeframe}`);
    // console.log(`  - Created At: ${result.createdAt}`);
    // console.log(`\n`);

    // Parse and display analysis
    let analysis;
    try {
      analysis =
        typeof result.analysis === "string"
          ? JSON.parse(result.analysis)
          : result.analysis;

      // console.log("📊 Analysis Content:");
      // console.log("  ✓ Meta information present");
      if (analysis.meta) {
        // console.log(`    - Confidence Score: ${analysis.meta.analysis_confidence_score}%`);
      }

      if (analysis.analysis) {
        // console.log("  ✓ Technical analysis present");
        if (analysis.analysis.categories) {
          // console.log(`    - Categories: ${Object.keys(analysis.analysis.categories).join(", ")}`);
        }
      }

      if (analysis.simulation_strategy) {
        // console.log("  ✓ Simulation strategy present");
        // console.log(`    - Direction: ${analysis.simulation_strategy.direction}`);
        if (analysis.simulation_strategy.theoretical_entry) {
          // console.log(
            `    - Entry Price: $${analysis.simulation_strategy.theoretical_entry.price}`
          );
        }
        if (analysis.simulation_strategy.target_levels) {
          // console.log(
            `    - Target Levels: ${analysis.simulation_strategy.target_levels.length} targets defined`
          );
        }
      }

      if (analysis.implementation) {
        // console.log("  ✓ Implementation steps present");
        if (analysis.implementation.simulation_steps) {
          // console.log(
            `    - Steps: ${analysis.implementation.simulation_steps.length} steps defined`
          );
        }
      }

      if (analysis.technical_rationale) {
        // console.log("  ✓ Technical rationale present");
        // console.log(
          `    - Trend Analysis: ${analysis.technical_rationale.trend_analysis.substring(0, 50)}...`
        );
      }

      if (analysis.contingency_scenarios) {
        // console.log("  ✓ Contingency scenarios present");
        // console.log(
          `    - Scenarios: ${analysis.contingency_scenarios.length} scenarios defined`
        );
      }

      // console.log(`\n✅ AI Analysis Complete!`);
      // console.log(`📊 Full analysis has ${Object.keys(analysis).length} main sections\n`);

      // Show sample of simulation strategy
      if (analysis.simulation_strategy) {
        // console.log("Sample Simulation Strategy:");
        // console.log(
          JSON.stringify(analysis.simulation_strategy, null, 2)
            .split("\n")
            .slice(0, 20)
            .join("\n")
        );
        // console.log("...\n");
      }
    } catch (e) {
      // console.log("⚠️  Could not parse analysis details:", e.message);
    }

    // console.log("✅ ========================================");
    // console.log("   AI INSIGHTS TEST COMPLETED SUCCESSFULLY");
    // console.log("   ========================================\n");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: "HEAD",
      }).catch(() => null);
      if (response && response.ok) {
        // console.log("✅ Server is ready\n");
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

// Run the test
(async () => {
  const serverReady = await waitForServer();
  if (!serverReady) {
    // console.log("⚠️  Server may not be responding, attempting test anyway...\n");
  }
  await testAIInsights();
})();
