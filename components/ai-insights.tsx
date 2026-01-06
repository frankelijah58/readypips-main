"use client";

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Play,
  BarChart3,
  Target,
  Eye,
  Coins,
  ListChecks,
  Copy,
} from "lucide-react";
import AnalysisModal from "./analysis-modal";
import { useAuth } from "@/components/auth-context";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

interface TechnicalIndicators {
  sma_20: number;
  sma_50: number;
  ema_12: number;
  ema_26: number;
  rsi: number;
  macd: number;
  macd_signal: number;
  bollinger_upper: number;
  bollinger_lower: number;
  bollinger_middle: number;
}

interface AIInsight {
  _id?: string;
  publicId?: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  summary: string;
  keyPoints: string[];
  riskLevel: "low" | "medium" | "high";
  recommendation: string;
  technicalAnalysis: {
    support: number;
    resistance: number;
    trend: string;
    indicators: string[];
  };
  strategy: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp?: string;
  symbol?: string;
  timeframe?: string;
  // Raw analysis data for detailed modal display
  analysis?: {
    categories: {
      [key: string]: {
        timeframes: string[];
        summary: string;
      };
    };
    key_indicators: string[];
    psychological_levels: {
      support: string;
      resistance: string;
    };
  };
  implementation?: {
    simulation_steps: Array<{
      step: number;
      action: string;
      condition: string;
    }>;
  };
  technical_rationale?: {
    trend_analysis: string;
    volume_confirmation: string;
    reward_risk_calculation: string;
  };
  contingency_scenarios?: Array<{
    scenario: string;
    condition: string;
    approach?: {
      direction: string;
      entry_level?: number;
      target_level?: number;
      invalidation_level?: number;
      reason: string;
    };
  }>;
  // Enhanced analysis structure
  marketOverview?: {
    direction: "Long" | "Short" | "Neutral";
    entryPoint: number;
    riskPercentage: number;
    riskRewardRatio: number;
    takeProfits: {
      tp1: number;
      tp2: number;
      tp3: number;
    };
    confidenceScore: number;
  };
  strategyDetails?: {
    entryRationale: string;
    stopLossRationale: string;
    takeProfitRationale: string;
    positionSizing: string;
  };
  marketAnalysis?: {
    shortTerm: string;
    midTerm: string;
    longTerm: string;
    keyIndicators: string;
    marketStructure: string;
    volumeAnalysis: string;
    volatilityAssessment: string;
  };
  psychologicalLevels?: {
    resistance: {
      strong: number[];
      moderate: number[];
    };
    support: {
      strong: number[];
      moderate: number[];
    };
  };
  executionSteps?: {
    steps: Array<{
      step: number;
      action: string;
      condition: string;
    }>;
  };
  analysisJustification?: {
    trendAnalysis: string;
    volumeConfirmation: string;
    riskRewardCalculation: string;
    probabilityAssessment: string;
  };
  alternateScenarios?: {
    bearishReversal?: {
      direction: string;
      entry: number;
      takeProfit: number;
      stopLoss: number;
      reasoning: string;
    };
    continuedConsolidation?: string;
    stayOutOfMarket?: string;
  };
}

interface AIInsightsProps {
  marketData: MarketData | null;
  symbol: string;
  onAnalysisCreated?: (analysis: AIInsight) => void;
}

interface AIInsightsRef {
  triggerAnalysis: () => void;
}

const TRADING_STRATEGIES = [
  {
    id: "harmonic",
    name: "Harmonic Patterns",
    description: "Trade harmonic chart patterns",
    defaultTimeframes: ["1H", "4H", "1D"],
  },
  {
    id: "scalping",
    name: "Scalping",
    description: "Quick trades with tight stops",
    defaultTimeframes: ["1", "5", "15"],
  },
  {
    id: "day_trading",
    name: "Day Trading",
    description: "Intraday trading with multiple timeframes",
    defaultTimeframes: ["1", "5", "15", "30"],
  },
  {
    id: "swing",
    name: "Swing Trading",
    description: "Medium-term position trading",
    defaultTimeframes: ["1H", "4H", "1D"],
  },
  {
    id: "trend",
    name: "Trend Following",
    description: "Follow major market trends",
    defaultTimeframes: ["4H", "1D", "1W"],
  },
  {
    id: "mean_reversion",
    name: "Mean Reversion",
    description: "Trade price reversals",
    defaultTimeframes: ["1H", "4H", "1D"],
  },
  {
    id: "breakout",
    name: "Breakout Trading",
    description: "Trade breakouts from ranges",
    defaultTimeframes: ["15", "30", "1H", "1D"],
  },
  {
    id: "momentum",
    name: "Momentum Trading",
    description: "Follow strong momentum moves",
    defaultTimeframes: ["5", "15", "30", "1H"],
  },
];

const TIMEFRAMES = [
  { value: "1", label: "1 minute" },
  { value: "5", label: "5 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "1H", label: "1 hour" },
  { value: "4H", label: "4 hours" },
  { value: "1D", label: "1 day" },
  { value: "1W", label: "1 week" },
];

const AIInsights = forwardRef<AIInsightsRef, AIInsightsProps>(
  ({ symbol, marketData, onAnalysisCreated }, ref) => {
    const { user } = useAuth();
    const [insights, setInsights] = useState<AIInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStrategy, setSelectedStrategy] = useState("harmonic");
    const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>([
      "H1",
    ]);
    const [showModal, setShowModal] = useState(false);
    const [analysisHistory, setAnalysisHistory] = useState<AIInsight[]>([]);

    // Load settings from localStorage on component mount
    useEffect(() => {
      const savedStrategy = localStorage.getItem("ai-insights-strategy");
      const savedTimeframes = localStorage.getItem("ai-insights-timeframes");

      if (savedStrategy) {
        setSelectedStrategy(savedStrategy);
        // Auto-set timeframes for the saved strategy
        const strategy = TRADING_STRATEGIES.find((s) => s.id === savedStrategy);
        if (strategy?.defaultTimeframes) {
          setSelectedTimeframes(strategy.defaultTimeframes);
        }
      }

      if (savedTimeframes && !savedStrategy) {
        try {
          setSelectedTimeframes(JSON.parse(savedTimeframes));
        } catch (e) {
          console.error("Error parsing saved timeframes:", e);
        }
      }
    }, []);

    // Save settings to localStorage when they change
    useEffect(() => {
      localStorage.setItem("ai-insights-strategy", selectedStrategy);
      localStorage.setItem(
        "ai-insights-timeframes",
        JSON.stringify(selectedTimeframes)
      );
    }, [selectedStrategy, selectedTimeframes]);

    // Expose triggerAnalysis method to parent component
    useImperativeHandle(ref, () => ({
      triggerAnalysis: analyzeMarketData,
    }));

    const analyzeMarketData = async () => {
      if (!marketData || !symbol) return;

      // Allow free analysis - no credit check needed
      // if (user && credits !== null && credits < 1) {
      //   setError(
      //     "Insufficient credits. Please purchase more credits to continue."
      //   );
      //   return;
      // }

      setLoading(true);
      setError(null);

      try {
        // Fetch bars and calculate indicators for all selected timeframes
        const allBarsData: { [timeframe: string]: any[] } = {};
        const allIndicators: { [timeframe: string]: TechnicalIndicators } = {};

        for (const timeframe of selectedTimeframes) {
          const response = await fetch(
            `/api/market-data/bars?symbol=${symbol}&timeframe=${timeframe}&limit=250`
          );
          if (response.ok) {
            const data = await response.json();
            allBarsData[timeframe] = data.bars || [];
            allIndicators[timeframe] = calculateTechnicalIndicators(
              data.bars || []
            );
          }
        }

        const primaryTimeframe = selectedTimeframes[0];
        const primaryIndicators =
          allIndicators[primaryTimeframe] || calculateTechnicalIndicators([]);
        const strategy = TRADING_STRATEGIES.find(
          (s) => s.id === selectedStrategy
        );

        // Get authentication token
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Log request data
        const requestData = {
          symbol,
          marketData,
          primaryIndicators,
          allBarsData,
          allIndicators,
          timeframes: selectedTimeframes,
          primaryTimeframe,
          analysisContext: {
            strategy: strategy?.name || selectedStrategy,
            strategyDescription: strategy?.description || "",
            selectedTimeframes,
          },
        };

        // console.log("🚀 [AI Insights] Sending request to API:");
        // console.log(
          "📊 [AI Insights] Request Data:",
          JSON.stringify(requestData, null, 2)
        );

        const response = await fetch("/api/ai-insights", {
          method: "POST",
          headers,
          body: JSON.stringify(requestData),
        });

        if (response.ok) {
          const data = await response.json();

          // Log API response
          // console.log("✅ [AI Insights] API Response received:");
          // console.log(
            "📊 [AI Insights] Response Data:",
            JSON.stringify(data, null, 2)
          );

          // Parse the analysis JSON string
          const analysisData = JSON.parse(data.analysis);

          // console.log(
            "📊 [AI Insights] Parsed Analysis Data:",
            JSON.stringify(analysisData, null, 2)
          );

          const newInsight = {
            _id: data._id,
            publicId: data.publicId,
            symbol: data.symbol,
            timeframe: data.timeframe,
            timestamp: new Date().toISOString(),
            strategy: strategy?.name || selectedStrategy,
            entryPrice: marketData.price,
            stopLoss: marketData.price * 0.95,
            takeProfit: marketData.price * 1.1,
            // Required properties for AIInsight interface
            sentiment: (analysisData.simulation_strategy?.direction === "Long"
              ? "bullish"
              : analysisData.simulation_strategy?.direction === "Short"
              ? "bearish"
              : "neutral") as "bullish" | "bearish" | "neutral",
            confidence:
              parseInt(analysisData.meta?.analysis_confidence_score) || 50,
            summary: `AI analysis for ${symbol} using ${
              strategy?.name || selectedStrategy
            } strategy`,
            keyPoints: [
              `Direction: ${
                analysisData.simulation_strategy?.direction || "Neutral"
              }`,
              `Entry: $${
                parseFloat(
                  analysisData.simulation_strategy?.theoretical_entry?.price
                ) || marketData.price
              }`,
              `Risk: ${
                parseFloat(
                  analysisData.simulation_strategy?.simulation_allocation?.parameter?.replace(
                    "%",
                    ""
                  )
                ) || 2.5
              }%`,
            ],
            riskLevel: "medium" as const,
            recommendation:
              "Follow the detailed analysis below for specific entry and exit points",
            technicalAnalysis: {
              support: marketData.low * 0.98,
              resistance: marketData.high * 1.02,
              trend:
                analysisData.simulation_strategy?.direction === "Long"
                  ? "Uptrend"
                  : analysisData.simulation_strategy?.direction === "Short"
                  ? "Downtrend"
                  : "Sideways",
              indicators: analysisData.analysis?.key_indicators || [],
            },
            // Enhanced analysis structure from the parsed data
            marketOverview: {
              direction:
                analysisData.simulation_strategy?.direction || "Neutral",
              entryPoint:
                parseFloat(
                  analysisData.simulation_strategy?.theoretical_entry?.price
                ) || marketData.price,
              riskPercentage:
                parseFloat(
                  analysisData.simulation_strategy?.simulation_allocation?.parameter?.replace(
                    "%",
                    ""
                  )
                ) || 2.5,
              riskRewardRatio: 2.5, // Default, could be calculated from targets
              takeProfits: {
                tp1:
                  parseFloat(
                    analysisData.simulation_strategy?.target_levels?.[0]?.price
                  ) || marketData.price * 1.02,
                tp2:
                  parseFloat(
                    analysisData.simulation_strategy?.target_levels?.[1]?.price
                  ) || marketData.price * 1.05,
                tp3:
                  parseFloat(
                    analysisData.simulation_strategy?.target_levels?.[2]?.price
                  ) || marketData.price * 1.08,
              },
              confidenceScore:
                parseInt(analysisData.meta?.analysis_confidence_score) || 50,
            },
            strategyDetails: {
              entryRationale:
                analysisData.simulation_strategy?.theoretical_entry?.reason ||
                "",
              stopLossRationale:
                analysisData.simulation_strategy?.invalidation_point?.reason ||
                "",
              takeProfitRationale:
                analysisData.simulation_strategy?.target_levels?.[0]?.reason ||
                "",
              positionSizing:
                analysisData.simulation_strategy?.simulation_allocation
                  ?.adjustment || "",
            },
            marketAnalysis: {
              shortTerm:
                analysisData.analysis?.categories?.short_term?.summary || "",
              midTerm:
                analysisData.analysis?.categories?.mid_term?.summary || "",
              longTerm:
                analysisData.analysis?.categories?.long_term?.summary || "",
              keyIndicators:
                analysisData.analysis?.key_indicators?.join(", ") || "",
              marketStructure:
                "Market structure analysis based on multi-timeframe data",
              volumeAnalysis: "Volume analysis with confirmation signals",
              volatilityAssessment: "ATR and volatility assessment",
            },
            psychologicalLevels: {
              resistance: {
                strong: [
                  parseFloat(
                    analysisData.analysis?.psychological_levels?.resistance
                      ?.split("Strong: ")?.[1]
                      ?.split(",")?.[0]
                  ) || marketData.high,
                ],
                moderate: [
                  parseFloat(
                    analysisData.analysis?.psychological_levels?.resistance?.split(
                      "Moderate: "
                    )?.[1]
                  ) || marketData.high * 0.99,
                ],
              },
              support: {
                strong: [
                  parseFloat(
                    analysisData.analysis?.psychological_levels?.support
                      ?.split("Strong: ")?.[1]
                      ?.split(",")?.[0]
                  ) || marketData.low,
                ],
                moderate: [
                  parseFloat(
                    analysisData.analysis?.psychological_levels?.support?.split(
                      "Moderate: "
                    )?.[1]
                  ) || marketData.low * 1.01,
                ],
              },
            },
            executionSteps: {
              steps:
                analysisData.implementation?.simulation_steps?.map(
                  (step: any, index: number) => ({
                    step: index + 1,
                    action: step.action,
                    condition: step.condition,
                  })
                ) || [],
            },
            analysisJustification: {
              trendAnalysis:
                analysisData.technical_rationale?.trend_analysis || "",
              volumeConfirmation:
                analysisData.technical_rationale?.volume_confirmation || "",
              riskRewardCalculation:
                analysisData.technical_rationale?.reward_risk_calculation || "",
              probabilityAssessment:
                "Probability assessment based on technical confluence",
            },
            alternateScenarios: {
              bearishReversal: analysisData.contingency_scenarios?.[0]
                ? {
                    direction:
                      analysisData.contingency_scenarios[0].approach.direction,
                    entry:
                      parseFloat(
                        analysisData.contingency_scenarios[0].approach
                          .entry_level
                      ) || marketData.price * 0.98,
                    takeProfit:
                      parseFloat(
                        analysisData.contingency_scenarios[0].approach
                          .target_level
                      ) || marketData.price * 0.96,
                    stopLoss:
                      parseFloat(
                        analysisData.contingency_scenarios[0].approach
                          .invalidation_level
                      ) || marketData.price * 0.99,
                    reasoning:
                      analysisData.contingency_scenarios[0].approach.reason,
                  }
                : undefined,
              continuedConsolidation:
                analysisData.contingency_scenarios?.[1]?.approach?.reason || "",
              stayOutOfMarket: "Stay out of market conditions not met",
            },
            // Raw analysis data for detailed modal display
            analysis: analysisData.analysis || (analysisData.raw ? { raw: analysisData.raw } : undefined),
            implementation: analysisData.implementation,
            technical_rationale: analysisData.technical_rationale,
            contingency_scenarios: analysisData.contingency_scenarios,
          };

          setInsights(newInsight);
          setAnalysisHistory((prev) => [newInsight, ...prev.slice(0, 4)]);

          // Free analysis - no credit deduction needed
          // if (user && credits !== null) {
          //   setCredits(credits - 1);
          // }

          // Notify parent component about new analysis
          if (onAnalysisCreated) {
            onAnalysisCreated(newInsight);
          }

          // Automatically open modal with the new analysis
          setShowModal(true);
        } else {
          const errorData = await response.json();
          console.error("❌ [AI Insights] API Error:", errorData);
          // Prefer detailed message if provided by server
          const message = errorData.details || errorData.error || "Failed to analyze market data";
          throw new Error(message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const calculateTechnicalIndicators = (bars: any[]): TechnicalIndicators => {
      if (bars.length < 50) {
        return {
          sma_20: 0,
          sma_50: 0,
          ema_12: 0,
          ema_26: 0,
          rsi: 0,
          macd: 0,
          macd_signal: 0,
          bollinger_upper: 0,
          bollinger_lower: 0,
          bollinger_middle: 0,
        };
      }

      const closes = bars.map((bar) => bar.close);
      const highs = bars.map((bar) => bar.high);
      const lows = bars.map((bar) => bar.low);

      // Simple SMA calculation
      const sma_20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma_50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;

      // Simple EMA calculation
      const ema_12 = closes.slice(-12).reduce((a, b) => a + b, 0) / 12;
      const ema_26 = closes.slice(-26).reduce((a, b) => a + b, 0) / 26;

      // Simple RSI calculation
      const gains = closes
        .slice(1)
        .map((close, i) => Math.max(0, close - closes[i]));
      const losses = closes
        .slice(1)
        .map((close, i) => Math.max(0, closes[i] - close));
      const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
      const rs = avgGain / (avgLoss || 1);
      const rsi = 100 - 100 / (1 + rs);

      // Simple MACD
      const macd = ema_12 - ema_26;
      const macd_signal = macd * 0.9; // Simplified signal line

      // Simple Bollinger Bands
      const bollinger_middle = sma_20;
      const variance =
        closes
          .slice(-20)
          .reduce(
            (sum, close) => sum + Math.pow(close - bollinger_middle, 2),
            0
          ) / 20;
      const stdDev = Math.sqrt(variance);
      const bollinger_upper = bollinger_middle + stdDev * 2;
      const bollinger_lower = bollinger_middle - stdDev * 2;

      return {
        sma_20,
        sma_50,
        ema_12,
        ema_26,
        rsi,
        macd,
        macd_signal,
        bollinger_upper,
        bollinger_lower,
        bollinger_middle,
      };
    };

    const getSentimentColor = (sentiment: string) => {
      switch (sentiment) {
        case "bullish":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "bearish":
          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      }
    };

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case "low":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "medium":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        case "high":
          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      }
    };

    const handleAnalysisClick = (analysis: AIInsight) => {
      setInsights(analysis);
      setShowModal(true);
    };

    const handleModalClose = () => {
      setShowModal(false);
      setInsights(null);
    };

    const handleStrategyChange = (strategyId: string) => {
      setSelectedStrategy(strategyId);
      const strategy = TRADING_STRATEGIES.find((s) => s.id === strategyId);
      if (strategy?.defaultTimeframes) {
        setSelectedTimeframes(strategy.defaultTimeframes);
        // console.log(
          `Strategy changed to ${strategy.name}, timeframes set to:`,
          strategy.defaultTimeframes
        );
      }
    };

    const handleTimeframeToggle = (timeframe: string) => {
      setSelectedTimeframes((prev) => {
        const newTimeframes = prev.includes(timeframe)
          ? prev.filter((tf) => tf !== timeframe)
          : [...prev, timeframe];
        // console.log(`Timeframes updated:`, newTimeframes);
        return newTimeframes;
      });
    };

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Analysis
            </h3>
          </div>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-900 dark:text-white" />
          )}
        </div>

        {/* Strategy Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">
            Strategy
          </label>
          <Select value={selectedStrategy} onValueChange={handleStrategyChange}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Select a strategy" />
            </SelectTrigger>
            <SelectContent>
              {TRADING_STRATEGIES.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{strategy.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {strategy.defaultTimeframes.join(", ")}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeframe Selection - Pills */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">
            Timeframes
          </label>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAMES.map((tf) => (
              <Badge
                key={tf.value}
                variant={
                  selectedTimeframes.includes(tf.value) ? "default" : "outline"
                }
                className={`cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-1 text-sm ${
                  selectedTimeframes.includes(tf.value)
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => handleTimeframeToggle(tf.value)}
              >
                {tf.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Selected Options Display */}
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Strategy:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {
                  TRADING_STRATEGIES.find((s) => s.id === selectedStrategy)
                    ?.name
                }
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Timeframes:
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedTimeframes.map((tf) => (
                <span
                  key={tf}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-medium text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700"
                >
                  {TIMEFRAMES.find((t) => t.value === tf)?.label}
                </span>
              ))}
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <Coins className="w-3 h-3 text-green-500 dark:text-green-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Analysis:{" "}
                <span className="font-medium text-green-600 dark:text-green-400">
                  FREE
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <Button
          onClick={analyzeMarketData}
          disabled={loading || !marketData}
          className="w-full h-9 text-sm bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? "Analyzing..." : "Free Analysis"}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span className="text-xs text-red-700 dark:text-red-300">
              {error}
            </span>
          </div>
        )}

        {/* Analysis Animation */}
        {loading && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <Brain className="absolute inset-0 m-auto h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              <div className="mt-4 text-center">
                <h4 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">
                  AI Analyzing Market Data
                </h4>
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Processing timeframes...
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Fetching market data
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Analyzing technical indicators
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-500 dark:text-gray-500">
                  Generating AI insights
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {insights && !loading && (
          <div className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sentiment
                    </span>
                    <Badge
                      variant={
                        insights.sentiment === "bullish"
                          ? "default"
                          : insights.sentiment === "bearish"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {insights.sentiment}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confidence
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {insights.confidence}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Risk Level
                    </span>
                    <Badge
                      variant={
                        insights.riskLevel === "low"
                          ? "default"
                          : insights.riskLevel === "high"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {insights.riskLevel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Points */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Key Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.keyPoints.slice(0, 3).map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowModal(true)}
                variant="outline"
                size="sm"
                className="flex-1 h-10"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button
                onClick={() => {
                  // Copy analysis to clipboard
                  navigator.clipboard.writeText(insights.summary);
                }}
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Modal */}
        <AnalysisModal
          isOpen={showModal}
          onClose={handleModalClose}
          analysis={insights}
        />
      </div>
    );
  }
);

AIInsights.displayName = "AIInsights";

export default AIInsights;
