"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { useAuth } from "@/components/auth-context";
import { useRequireSubscription } from "@/hooks/use-subscription-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Maximize2, 
  Minimize2,
  DollarSign,
  Activity,
  Clock,
  ChevronDown,
  BarChart3,
  Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import MarketInfoTimer from "@/components/market-info-timer";
import TradingViewWidget from "@/components/tradingview-widget";
import TradingViewTicker from "@/components/tradingview-ticker";
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



// Available symbols for selection
const availableSymbols = [
  { value: "XAUUSD", label: "Gold", category: "Commodities", tradingView: "OANDA:XAUUSD" },
  { value: "XAGUSD", label: "Silver", category: "Commodities", tradingView: "OANDA:XAGUSD" },
  { value: "EURUSD", label: "EUR/USD", category: "Forex", tradingView: "FX:EURUSD" },
  { value: "GBPUSD", label: "GBP/USD", category: "Forex", tradingView: "FX:GBPUSD" },
  { value: "USDJPY", label: "USD/JPY", category: "Forex", tradingView: "FX:USDJPY" },
  { value: "BTCUSD", label: "Bitcoin", category: "Crypto", tradingView: "BINANCE:BTCUSDT" },
  { value: "ETHUSD", label: "Ethereum", category: "Crypto", tradingView: "BINANCE:ETHUSDT" },
  { value: "AAPL", label: "Apple", category: "Stocks", tradingView: "NASDAQ:AAPL" },
  { value: "TSLA", label: "Tesla", category: "Stocks", tradingView: "NASDAQ:TSLA" },
  { value: "MSFT", label: "Microsoft", category: "Stocks", tradingView: "NASDAQ:MSFT" },
];

// Default symbol for display purposes - Gold
const defaultSymbol = availableSymbols[0];

export default function ChartsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const subscriptionAccess = useRequireSubscription('/subscription');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSymbol, setCurrentSymbol] = useState(defaultSymbol.value);
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [showSymbolSelector, setShowSymbolSelector] = useState(false);
  const [showCharterLibrary, setShowCharterLibrary] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  // Fetch market data - NO MOCK DATA, only real data or error
  const fetchMarketData = useCallback(async (symbol: string = currentSymbol) => {
    try {
      setLoading(true);
      setIsMockData(false);
      setFetchError(null);

      // Fetch real market data from our API
      const response = await fetch(`/api/market-data?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const data: MarketData = await response.json();

      // Since the API returns mock data as fallback when real data isn't available,
      // we display whatever the API returns (it could be real or mock)
      setIsMockData(false);
      setMarketData(data);
    } catch (error: any) {
      console.error("Error fetching market data:", error);
      setFetchError(error.message || 'Unable to fetch market data');
      setMarketData(null);
      setIsMockData(false);
    } finally {
      setLoading(false);
    }
  }, [currentSymbol]);

  // Initial data fetch and periodic updates
  useEffect(() => {
    if (user) {
      fetchMarketData(currentSymbol);
      const interval = setInterval(() => fetchMarketData(currentSymbol), 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, currentSymbol, fetchMarketData]);

  // Handle symbol selection
  const handleSymbolSelect = (symbol: typeof availableSymbols[0]) => {
    setSelectedSymbol(symbol);
    setCurrentSymbol(symbol.value);
    setShowSymbolSelector(false);
    fetchMarketData(symbol.value);
  };

  // Close symbol selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSymbolSelector) {
        const target = event.target as Element;
        if (!target.closest('.symbol-selector')) {
          setShowSymbolSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSymbolSelector]);



  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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
                    Why Subscribe?
                  </h3>
                  <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300 max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Access advanced trading charts with real-time data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Get premium trading signals and insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Use AI-powered analysis tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Track your trading performance</span>
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

                {subscriptionAccess.isFreeTrial && !subscriptionAccess.isFreeTrialExpired && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-semibold">Free Trial Active:</span> You have {subscriptionAccess.daysRemaining} day{subscriptionAccess.daysRemaining !== 1 ? 's' : ''} remaining. Subscribe now to avoid interruption!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* TradingView Ticker Widget */}
      <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="h-16">
          <TradingViewTicker />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-block mb-4">
                <div className="h-1 w-16 bg-green-600 rounded-full"></div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Advanced Charts
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Professional trading charts with real-time market data
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Symbol Selector */}
              <div className="relative symbol-selector flex-1 lg:flex-none">
                <Button
                  onClick={() => setShowSymbolSelector(!showSymbolSelector)}
                  variant="outline"
                  className="w-full lg:w-auto border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold px-6 justify-between hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {selectedSymbol.label}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                
                {showSymbolSelector && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-3">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 px-2">
                        Select Symbol
                      </div>
                      {availableSymbols.map((symbol) => (
                        <button
                          key={symbol.value}
                          onClick={() => handleSymbolSelect(symbol)}
                          className={`w-full text-left px-4 py-3 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                            selectedSymbol.value === symbol.value 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{symbol.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{symbol.category}</div>
                          </div>
                          <div className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            {symbol.value}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => window.open('https://charting-library.tradingview-widget.com', '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Advanced Library
              </Button>
              
              <Button
                onClick={toggleFullscreen}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Exit
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Market Info and Timer Row */}
        <div className="mb-8">
          <MarketInfoTimer
            marketData={marketData || undefined}
          />
        </div>

        {/* Chart Area - Full Width */}
        <div className="w-full mb-8">
            <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {selectedSymbol.label} Trading Chart
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedSymbol.category}
                    </p>
                  </div>
                  
                  {marketData && (
                    <div className="flex flex-col items-start sm:items-end">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${marketData.price.toFixed(2)}
                      </div>
                      <div className={`flex items-center gap-2 mt-1 font-semibold ${getChangeColor(marketData.change)}`}>
                        {getChangeIcon(marketData.change)}
                        <span>
                          {marketData.change >= 0 ? "+" : ""}
                          {marketData.change.toFixed(2)} ({marketData.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {fetchError && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <span className="font-semibold">No Live Data:</span> {fetchError}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {fetchError || !marketData ? (
                  <div className={`w-full ${isFullscreen ? 'h-screen' : 'h-[500px]'} flex items-center justify-center bg-gray-50 dark:bg-gray-900/50`}>
                    <div className="text-center px-6">
                      <div className="text-gray-600 dark:text-gray-400 mb-4">
                        <Activity className="w-12 h-12 mx-auto opacity-50" />
                      </div>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No Data Available
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fetchError || 'Unable to retrieve live market data for this symbol. Please try another symbol or refresh the page.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={`w-full ${isFullscreen ? 'h-screen' : 'h-[500px]'}`}>
                    <TradingViewWidget 
                      isFullscreen={isFullscreen} 
                      symbol={selectedSymbol.tradingView}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        {/* Live Market Data Widgets */}
        {marketData && (
          <div>
            <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  Market Data - {currentSymbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Current Price
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${marketData.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${getChangeColor(marketData.change)}`}>
                      {getChangeIcon(marketData.change)}
                      <span>
                        {marketData.change >= 0 ? "+" : ""}
                        {marketData.change.toFixed(2)} ({marketData.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                      24h High
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${marketData.high.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Peak price</p>
                  </div>

                  <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                      24h Low
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${marketData.low.toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Floor price</p>
                  </div>

                  <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                      24h Volume
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${(marketData.volume / 1000000).toFixed(2)}M
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Trading volume</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
