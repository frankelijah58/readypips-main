"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RefreshCw, Target, AlertTriangle } from "lucide-react";

interface HarmonicPattern {
  name: string;
  type: "bullish" | "bearish";
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  ratios: {
    xab: number;
    abc: number;
    bcd: number;
    xad: number;
  };
}

interface HarmonicAnalysis {
  symbol: string;
  patterns: HarmonicPattern[];
  fibLevels: Record<string, number>;
  lastUpdate: Date;
}

interface HarmonicChartProps {
  symbol: string;
  timeframe: string;
  analysis: HarmonicAnalysis | null;
  config: {
    tradeSize: number;
    ewRate: number;
    tpRate: number;
    slRate: number;
    showPatterns: boolean;
    showFibLevels: boolean;
  };
  onSymbolChange?: (newSymbol: string) => void;
}

declare global {
  interface Window {
    TradingView: any;
    Datafeeds: any;
    HarmonicPatternStrategy: any;
  }
}

const getLanguageFromURL = (): string => {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(location.search);
  return results === null
    ? "en"
    : decodeURIComponent(results[1].replace(/\+/g, " "));
};

export function HarmonicChart({
  symbol,
  timeframe,
  analysis,
  config,
  onSymbolChange,
}: HarmonicChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const strategyRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [chartReady, setChartReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPatterns, setCurrentPatterns] = useState<HarmonicPattern[]>([]);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);

  // Load scripts if not already loaded
  const loadScripts = useCallback(async () => {
    if (!window.TradingView) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/charting_library.standalone.js";
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    }

    if (!window.Datafeeds) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/datafeed.js";
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    }
  }, []);

  // Initialize datafeed
  const initDatafeed = useCallback(() => {
    if (!window.Datafeeds) {
      throw new Error("Datafeeds not loaded");
    }
    return new window.Datafeeds.UDFCompatibleDatafeed();
  }, []);

  // Load the Frank State Strategy
  useEffect(() => {
    const loadStrategy = async () => {
      try {
        const script = document.createElement("script");
        script.src = "/frank-state-strategy.js";
        script.onload = () => {
          if (window.HarmonicPatternStrategy) {
            strategyRef.current = new window.HarmonicPatternStrategy({
              tradeSize: config.tradeSize,
              ewRate: config.ewRate,
              tpRate: config.tpRate,
              slRate: config.slRate,
              showPatterns: config.showPatterns,
              showFib: {
                "0.000": true,
                "0.236": true,
                "0.382": true,
                "0.500": true,
                "0.618": true,
                "0.764": true,
                "1.000": true,
              },
            });
            // console.log("Frank State Strategy loaded successfully");
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Frank State Strategy:", error);
      }
    };

    loadStrategy();
  }, [config]);

  // Initialize TradingView chart
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      // console.log("🔄 [TradingView] Widget already initialized, skipping...");
      return;
    }

    const initWidget = async () => {
      try {
        // console.log(
        //   "🚀 [TradingView] Initializing harmonic analysis widget..."
        // );
        isInitializedRef.current = true;

        await loadScripts();

        // Ensure container exists
        if (!chartContainerRef.current) {
          throw new Error("Chart container not found");
        }

        // Initialize global TradingView settings
        (window as any).TradingView = (window as any).TradingView || {};
        (window as any).TradingView.actualResolution = timeframe;
        (window as any).TradingView.currentlyDisplayedSymbol = symbol;

        // console.log("🔧 [TradingView] Setting up harmonic analysis chart");

        // Initialize datafeed
        const datafeed = initDatafeed();

        const widgetOptions = {
          symbol: symbol,
          datafeed: datafeed,
          interval: timeframe,
          container: chartContainerRef.current,
          library_path: "/charting_library/",
          locale: getLanguageFromURL(),
          theme: "dark",
          timezone: "Etc/UTC",
          debug: false,
          fullscreen: false,
          autosize: true,
          disabled_features: [
            "volume_force_overlay",
            "create_volume_indicator_by_default",
            "study_templates",
          ],
          enabled_features: [
            "show_symbol_logos",
            "display_market_status",
            "side_toolbar_in_fullscreen_mode",
          ],
          charts_storage_url: "https://saveload.tradingview.com",
          charts_storage_api_version: "1.1",
          client_id: "tradingview.com",
          user_id: "public_user_id",
          studies_overrides: {},
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
          },
          time_frames: [
            { text: "1m", resolution: "1" },
            { text: "2m", resolution: "2" },
            { text: "3m", resolution: "3" },
            { text: "5m", resolution: "5" },
            { text: "10m", resolution: "10" },
            { text: "15m", resolution: "15" },
            { text: "30m", resolution: "30" },
            { text: "1h", resolution: "60" },
            { text: "2h", resolution: "120" },
            { text: "4h", resolution: "240" },
            { text: "8h", resolution: "480" },
            { text: "1D", resolution: "D" },
          ],
        };

        // console.log("⚙️ [TradingView] Creating harmonic analysis widget");
        const tvWidget = new window.TradingView.widget(widgetOptions);
        widgetRef.current = tvWidget;

        tvWidget.onChartReady(() => {
          // console.log("✅ [TradingView] Harmonic analysis chart is ready");
          setChartReady(true);

          // Listen for symbol changes
          const chart = tvWidget.activeChart();
          if (chart) {
            chart.onSymbolChanged().subscribe(null, (symbolInfo: any) => {
              const newSymbol = symbolInfo.full_name || symbolInfo.name;
              // console.log(`🔄 [TradingView] Symbol changed to: ${newSymbol}`);
              setCurrentSymbol(newSymbol);

              // Notify parent component about symbol change
              if (onSymbolChange) {
                onSymbolChange(newSymbol);
              }

              // Trigger new analysis for the new symbol
              setTimeout(() => {
                startRealTimeAnalysis(newSymbol);
              }, 1000);
            });
          }

          // Start real-time analysis after chart is ready
          setTimeout(() => {
            startRealTimeAnalysis(symbol);
          }, 2000);
        });

        return tvWidget;
      } catch (error) {
        console.error(
          "❌ [TradingView] Error initializing harmonic analysis widget:",
          error
        );
        isInitializedRef.current = false;
        setChartReady(false);
        throw error;
      }
    };

    let tvWidget: any;
    initWidget().then((widget) => {
      tvWidget = widget;
    });

    return () => {
      if (tvWidget) {
        // console.log("🧹 [TradingView] Cleaning up harmonic analysis widget");
        tvWidget.remove();
        widgetRef.current = null;
        isInitializedRef.current = false;
        setChartReady(false);
      }
    };
  }, [symbol, timeframe, loadScripts, initDatafeed, onSymbolChange]);

  // Get chart data from our API
  const getChartData = async (
    symbolToAnalyze: string = currentSymbol
  ): Promise<any[]> => {
    try {
      const response = await fetch(
        `/api/market-data?symbol=${symbolToAnalyze}&interval=${timeframe}`
      );
      if (response.ok) {
        const data = await response.json();

        // Handle the new API response format
        if (data.success && data.data) {
          return data.data;
        } else if (Array.isArray(data)) {
          // Fallback for old format
          return data;
        } else {
          console.error("Invalid API response format:", data);
          return [];
        }
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
    return [];
  };

  // Real-time analysis function
  const startRealTimeAnalysis = (symbolToAnalyze: string = currentSymbol) => {
    if (!strategyRef.current || !widgetRef.current) return;

    setIsAnalyzing(true);

    // Get chart data and analyze patterns
    const analyzeCurrentData = async () => {
      try {
        const chartData = await getChartData(symbolToAnalyze);

        if (chartData && chartData.length > 0 && strategyRef.current) {
          const result = strategyRef.current.analyze(chartData);

          if (result.patterns && result.patterns.length > 0) {
            setCurrentPatterns(result.patterns);

            // Add annotations to chart
            addChartAnnotations(result.patterns, result.fibLevels);

            // console.log(
            //   `🔍 Found ${result.patterns.length} harmonic patterns for ${symbolToAnalyze}`
            // );
          }
        }
      } catch (error) {
        console.error("Error in real-time analysis:", error);
      }
    };

    // Run analysis every 30 seconds
    const interval = setInterval(analyzeCurrentData, 30000);
    analyzeCurrentData(); // Initial analysis

    return () => clearInterval(interval);
  };

  // Add annotations to the chart
  const addChartAnnotations = (patterns: any[], fibLevels: any) => {
    if (!widgetRef.current) return;

    try {
      const chart = widgetRef.current.activeChart();

      // Clear existing shapes
      chart.removeAllShapes();

      patterns.forEach((pattern, index) => {
        const color = pattern.type === "bullish" ? "#00ff00" : "#ff0000";

        // Add pattern label
        chart.createShape(
          { time: Date.now() / 1000, price: pattern.entryPrice },
          {
            text: `${pattern.name} (${pattern.confidence}%)`,
            fontsize: 12,
            color: color,
            backgroundColor: color,
            borderColor: color,
            borderSize: 1,
            borderRadius: 4,
            padding: 4,
          }
        );

        // Add entry point
        chart.createShape(
          { time: Date.now() / 1000, price: pattern.entryPrice },
          {
            text: "ENTRY",
            fontsize: 10,
            color: "#ffffff",
            backgroundColor: color,
            borderColor: color,
            borderSize: 2,
            borderRadius: 2,
            padding: 2,
          }
        );

        // Add target line
        chart.createShape(
          { time: Date.now() / 1000, price: pattern.targetPrice },
          {
            text: "TARGET",
            fontsize: 10,
            color: "#ffffff",
            backgroundColor: "#00ff00",
            borderColor: "#00ff00",
            borderSize: 2,
            borderRadius: 2,
            padding: 2,
          }
        );

        // Add stop loss line
        chart.createShape(
          { time: Date.now() / 1000, price: pattern.stopLoss },
          {
            text: "STOP",
            fontsize: 10,
            color: "#ffffff",
            backgroundColor: "#ff0000",
            borderColor: "#ff0000",
            borderSize: 2,
            borderRadius: 2,
            padding: 2,
          }
        );
      });

      // Add Fibonacci levels
      Object.entries(fibLevels).forEach(([level, price]) => {
        chart.createShape(
          { time: Date.now() / 1000, price: price as number },
          {
            text: `Fib ${level}`,
            fontsize: 8,
            color: "#ffffff",
            backgroundColor: "#666666",
            borderColor: "#666666",
            borderSize: 1,
            borderRadius: 2,
            padding: 2,
          }
        );
      });
    } catch (error) {
      console.error("Error adding chart annotations:", error);
    }
  };

  const refreshAnalysis = () => {
    if (strategyRef.current) {
      strategyRef.current.reset();
      startRealTimeAnalysis(currentSymbol);
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant={isAnalyzing ? "default" : "secondary"}>
            {isAnalyzing ? (
              <>
                <Play className="w-3 h-3 mr-1" />
                Analyzing
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 mr-1" />
                Paused
              </>
            )}
          </Badge>

          <Badge variant="outline">
            <Target className="w-3 h-3 mr-1" />
            {currentSymbol}
          </Badge>

          {currentPatterns.length > 0 && (
            <Badge variant="outline">
              <Target className="w-3 h-3 mr-1" />
              {currentPatterns.length} Patterns
            </Badge>
          )}
        </div>

        <Button onClick={refreshAnalysis} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div
          ref={chartContainerRef}
          className="w-full h-[600px] border rounded-lg"
        />

        {/* Loading Overlay */}
        {!chartReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading harmonic analysis chart...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Analysis Status */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Latest Analysis</h4>
            <p className="text-sm text-muted-foreground">
              {analysis.lastUpdate.toLocaleString()}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Patterns Found</h4>
            <p className="text-2xl font-bold">{analysis.patterns.length}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Symbol</h4>
            <p className="text-sm font-medium">{analysis.symbol}</p>
          </div>
        </div>
      )}

      {/* Strategy Status */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <h4 className="font-semibold mb-2 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Strategy Status
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Trade Size:</span>
            <span className="ml-2 font-medium">
              ${config.tradeSize.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Entry Rate:</span>
            <span className="ml-2 font-medium">
              {(config.ewRate * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Take Profit:</span>
            <span className="ml-2 font-medium">
              {(config.tpRate * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Stop Loss:</span>
            <span className="ml-2 font-medium">
              {(Math.abs(config.slRate) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
