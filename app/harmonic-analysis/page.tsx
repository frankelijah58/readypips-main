"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Play,
  Loader2,
  Settings,
  Zap,
  Lock,
  Activity,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-context";
import { useRequireSubscription } from "@/hooks/use-subscription-access";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HarmonicChart } from "@/components/harmonic-chart";

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

export default function HarmonicAnalysisPage() {
  const { user } = useAuth();
  const router = useRouter();
  const subscriptionAccess = useRequireSubscription('/subscription');
  const [analysis, setAnalysis] = useState<HarmonicAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [currentSymbol, setCurrentSymbol] = useState("frxXAUUSD");
  const [strategyConfig, setStrategyConfig] = useState({
    tradeSize: 10000,
    ewRate: 0.382,
    tpRate: 0.618,
    slRate: -0.618,
    showPatterns: true,
    showFibLevels: true,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  const timeframes = [
    { value: "1m", label: "1 Minute" },
    { value: "5m", label: "5 Minutes" },
    { value: "15m", label: "15 Minutes" },
    { value: "30m", label: "30 Minutes" },
    { value: "1h", label: "1 Hour" },
    { value: "4h", label: "4 Hours" },
    { value: "1D", label: "Daily" },
    { value: "1W", label: "Weekly" },
  ];

  const analyzeHarmonicPatterns = async (symbol: string = currentSymbol) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/harmonic-analysis?symbol=${symbol}&timeframe=${selectedTimeframe}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(strategyConfig),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        console.error("Failed to analyze harmonic patterns");
      }
    } catch (error) {
      console.error("Error analyzing harmonic patterns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle symbol changes from the chart
  const handleSymbolChange = (newSymbol: string) => {
    // console.log(`🔄 [Page] Symbol changed to: ${newSymbol}`);
    setCurrentSymbol(newSymbol);
    // Trigger new analysis for the new symbol
    analyzeHarmonicPatterns(newSymbol);
  };

  useEffect(() => {
    analyzeHarmonicPatterns();
  }, [selectedTimeframe]);

  if (!user) {
    return null;
  }

  // Show subscription required message if access is denied
  if (subscriptionAccess.loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-orange-600" />
                </div>
                <CardTitle className="text-3xl mb-2">
                  Subscription Required
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  {subscriptionAccess.message}
                </p>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="bg-muted rounded-lg p-6">
                  <h3 className="font-semibold mb-3">
                    Access Premium Harmonic Analysis
                  </h3>
                  <ul className="text-left space-y-2 text-sm max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Advanced harmonic pattern recognition</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Real-time Fibonacci level analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Entry and exit point recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Frank State Strategy implementation</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/subscription">
                    <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-6 text-lg">
                      View Subscription Plans
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="px-8 py-6 text-lg">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Harmonic Pattern Analysis</h1>
          <p className="text-muted-foreground">
            Advanced harmonic pattern recognition using the Frank State
            Strategy. Change symbols directly from the TradingView chart
            interface.
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Analysis Settings
            </CardTitle>
            <CardDescription>
              Configure timeframe and strategy parameters. Use the chart's
              symbol selector to change symbols.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Timeframe
                </label>
                <Select
                  value={selectedTimeframe}
                  onValueChange={setSelectedTimeframe}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframes.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Trade Size
                </label>
                <input
                  type="number"
                  value={strategyConfig.tradeSize}
                  onChange={(e) =>
                    setStrategyConfig((prev) => ({
                      ...prev,
                      tradeSize: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => analyzeHarmonicPatterns()}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Update Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Harmonic Pattern Chart</CardTitle>
            <CardDescription>
              Real-time harmonic pattern analysis with entry points and
              Fibonacci levels. Change symbols using the chart's symbol
              selector.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HarmonicChart
              symbol={currentSymbol}
              timeframe={selectedTimeframe}
              analysis={analysis}
              config={strategyConfig}
              onSymbolChange={handleSymbolChange}
            />
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Latest harmonic pattern analysis for {analysis.symbol}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Symbol</h4>
                  <p className="text-sm font-medium">{analysis.symbol}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Patterns Found</h4>
                  <p className="text-2xl font-bold">
                    {analysis.patterns.length}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Last Update</h4>
                  <p className="text-sm text-muted-foreground">
                    {analysis.lastUpdate.toLocaleString()}
                  </p>
                </div>
              </div>

              {analysis.patterns.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Detected Patterns</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.patterns.map((pattern, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{pattern.name}</h5>
                          <Badge
                            variant={
                              pattern.type === "bullish"
                                ? "default"
                                : "destructive"
                            }
                            className="flex items-center"
                          >
                            {pattern.type === "bullish" ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {pattern.type.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Confidence:
                            </span>
                            <span className="ml-2 font-medium">
                              {pattern.confidence.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Entry:
                            </span>
                            <span className="ml-2 font-medium">
                              ${pattern.entryPrice.toFixed(4)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Target:
                            </span>
                            <span className="ml-2 font-medium">
                              ${pattern.targetPrice.toFixed(4)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Stop Loss:
                            </span>
                            <span className="ml-2 font-medium">
                              ${pattern.stopLoss.toFixed(4)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <h6 className="text-xs font-medium mb-2">
                            Fibonacci Ratios
                          </h6>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div>XAB: {pattern.ratios.xab.toFixed(3)}</div>
                            <div>ABC: {pattern.ratios.abc.toFixed(3)}</div>
                            <div>BCD: {pattern.ratios.bcd.toFixed(3)}</div>
                            <div>XAD: {pattern.ratios.xad.toFixed(3)}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {analysis.fibLevels &&
                Object.keys(analysis.fibLevels).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">Fibonacci Levels</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(analysis.fibLevels).map(
                        ([level, price]) => (
                          <div key={level} className="p-3 border rounded-lg">
                            <div className="text-sm font-medium">
                              Fib {level}
                            </div>
                            <div className="text-lg font-bold">
                              ${(price as number).toFixed(4)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Strategy Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Strategy Configuration
            </CardTitle>
            <CardDescription>
              Current Frank State Strategy settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Trade Size</h4>
                <p className="text-2xl font-bold">
                  ${strategyConfig.tradeSize.toLocaleString()}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Entry Rate</h4>
                <p className="text-2xl font-bold">
                  {(strategyConfig.ewRate * 100).toFixed(1)}%
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Take Profit</h4>
                <p className="text-2xl font-bold">
                  {(strategyConfig.tpRate * 100).toFixed(1)}%
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Stop Loss</h4>
                <p className="text-2xl font-bold">
                  {(Math.abs(strategyConfig.slRate) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
