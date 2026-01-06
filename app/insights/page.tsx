"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  History,
  Newspaper,
  Settings,
  Plus,
  ChevronRight,
  Lock,
  Activity,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import SymbolSelector from "@/components/symbol-selector";
import TradingViewWidget from "@/components/tradingview-widget";
import AIInsights from "@/components/ai-insights";
import AnalysisHistory from "@/components/analysis-history";
import MarketNews from "@/components/market-news";
import { useAuth } from "@/components/auth-context";
import { useRequireSubscription } from "@/hooks/use-subscription-access";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

interface AIInsight {
  _id?: string;
  publicId?: string;
  symbol?: string;
  timeframe?: string;
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
  rawAnalysis?: any;
}

const popularSymbols = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "OANDA:XAUUSD", name: "Gold" },
  { symbol: "GLD", name: "SPDR Gold Trust" },
  { symbol: "FX:EURUSD", name: "EUR/USD" },
  { symbol: "FX:GBPUSD", name: "GBP/USD" },
  { symbol: "FX:USDJPY", name: "USD/JPY" },
  { symbol: "FX:AUDUSD", name: "AUD/USD" },
  { symbol: "FX:USDCAD", name: "USD/CAD" },
  { symbol: "FX:NZDUSD", name: "NZD/USD" },
  { symbol: "FX:USDCHF", name: "USD/CHF" },
  { symbol: "FX:GBPAUD", name: "GBP/AUD" },
];

export default function InsightsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const subscriptionAccess = useRequireSubscription('/subscription');
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    // Get from localStorage or default to gold
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedSymbol") || "OANDA:XAUUSD";
    }
    return "OANDA:XAUUSD";
  });
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AIInsight[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIInsight | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("analysis"); // Default to analysis open
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true); // Show analysis sections by default

  // Add ref for AIInsights component
  const aiInsightsRef = useRef<{ triggerAnalysis: () => void }>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleAnalysisCreated = (analysis: AIInsight) => {
    setAnalysisHistory((prev) => [analysis, ...prev.slice(0, 4)]);
  };

  const handleAnalysisClick = (analysis: AIInsight) => {
    // Handle analysis click
    // console.log("Analysis clicked:", analysis);
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSymbol", symbol);
    }
    setBottomSheetOpen(false);
  };

  if (!user) {
    return null;
  }

  // Show subscription required message if access is denied
  if (subscriptionAccess.loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-orange-600" />
                </div>
                <CardTitle className="text-3xl text-gray-900 dark:text-white mb-2">
                  Subscription Required
                </CardTitle>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {subscriptionAccess.message}
                </p>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Access Premium AI Insights
                  </h3>
                  <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300 max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>AI-powered market analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Real-time trading insights and sentiment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Technical analysis with entry/exit points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Market news and analysis history</span>
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
                    <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-8 py-6 text-lg">
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBottomSheetOpen(true)}
                className="text-lg font-semibold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1 group"
              >
                {selectedSymbol}
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to change
                </span>
              </button>
              {marketData && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${marketData.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs ${
                      marketData.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {marketData.change >= 0 ? "+" : ""}
                    {marketData.change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart Section - Much Bigger */}
        <div className="h-[500px] bg-white dark:bg-gray-800">
          <TradingViewWidget />
        </div>

        {/* Analysis Sections - Only when triggered */}
        {showAnalysis && (
          <div className="p-4 space-y-4">
            {/* AI Analysis Section */}
            <Collapsible
              open={activeSection === "analysis"}
              onOpenChange={() => toggleSection("analysis")}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>AI Analysis</span>
                  </div>
                  {activeSection === "analysis" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <AIInsights
                      ref={aiInsightsRef}
                      marketData={marketData}
                      symbol={selectedSymbol}
                      onAnalysisCreated={handleAnalysisCreated}
                    />
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* History Section */}
            <Collapsible
              open={activeSection === "history"}
              onOpenChange={() => toggleSection("history")}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Analysis History</span>
                  </div>
                  {activeSection === "history" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <AnalysisHistory
                      analyses={analysisHistory}
                      onAnalysisClick={handleAnalysisClick}
                    />
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* News Section */}
            <Collapsible
              open={activeSection === "news"}
              onOpenChange={() => toggleSection("news")}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Market News</span>
                  </div>
                  {activeSection === "news" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <MarketNews symbol={selectedSymbol} />
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => {
              // Just trigger the analysis since sections are visible by default
              setActiveSection("analysis");
              // Trigger the analysis after a short delay to ensure the component is rendered
              setTimeout(() => {
                aiInsightsRef.current?.triggerAnalysis();
              }, 100);
            }}
            size="lg"
            className="h-16 px-6 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <span className="text-xl">🧠</span>
            <span className="text-sm font-medium">Analyze</span>
          </Button>
        </div>

        {/* Bottom Sheet for Symbol Selection */}
        {bottomSheetOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
            <div className="bg-white dark:bg-gray-800 w-full max-h-[60vh] rounded-t-lg flex flex-col">
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Symbol
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBottomSheetOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Popular Symbols Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {popularSymbols.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSymbolSelect(item.symbol)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedSymbol === item.symbol
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600"
                      }`}
                    >
                      <div className="font-semibold text-sm">{item.symbol}</div>
                      <div className="text-xs opacity-75">{item.name}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Symbol Input */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Custom Symbol
                  </h3>
                  <SymbolSelector
                    onSymbolChange={handleSymbolSelect}
                    onMarketDataUpdate={setMarketData}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout (existing)
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      <div className="flex h-screen">
        {/* Left Panel - Chart */}
        <div className="flex-1 flex flex-col">
          {/* Market Data Section - Above Chart */}
          {marketData && (
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Price
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${marketData.price.toFixed(2)}
                  </div>
                  <div
                    className={`text-sm ${
                      marketData.change >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {marketData.change >= 0 ? "+" : ""}
                    {marketData.change.toFixed(2)} (
                    {marketData.changePercent.toFixed(2)}%)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Open
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ${marketData.open.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    High
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ${marketData.high.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Low
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ${marketData.low.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Volume
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {marketData.volume.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart Area */}
          <div className="flex-1 relative">
            <TradingViewWidget />
          </div>
        </div>

        {/* Right Panel - Analysis and News */}
        <div className="w-96 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
          {/* Symbol Selector - Top of right panel */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <SymbolSelector
              onSymbolChange={setSelectedSymbol}
              onMarketDataUpdate={setMarketData}
            />
          </div>

          {/* AI Analysis Section */}
          <div className="flex-1 p-4 overflow-y-auto">
            <AIInsights
              marketData={marketData}
              symbol={selectedSymbol}
              onAnalysisCreated={handleAnalysisCreated}
            />
          </div>

          {/* Tabs for History and News */}
          <div className="border-t border-gray-200 dark:border-gray-800">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  History
                </TabsTrigger>
                <TabsTrigger value="news" className="text-xs">
                  <Newspaper className="h-3 w-3 mr-1" />
                  News
                </TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="max-h-48 overflow-y-auto">
                <AnalysisHistory
                  analyses={analysisHistory}
                  onAnalysisClick={handleAnalysisClick}
                />
              </TabsContent>
              <TabsContent value="news" className="max-h-48 overflow-y-auto">
                <MarketNews symbol={selectedSymbol} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
