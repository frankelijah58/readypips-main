"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

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

interface SymbolSelectorProps {
  onSymbolChange: (symbol: string) => void;
  onMarketDataUpdate: (data: MarketData) => void;
}

const POPULAR_SYMBOLS = [
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

export default function SymbolSelector({
  onSymbolChange,
  onMarketDataUpdate,
}: SymbolSelectorProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    // Get from localStorage or default to gold
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedSymbol") || "OANDA:XAUUSD";
    }
    return "OANDA:XAUUSD";
  });
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);

  const fetchMarketData = async (symbol: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/market-data?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setMarketData(data);
        onMarketDataUpdate(data);

        // Add to recent symbols
        setRecentSymbols((prev) => {
          const filtered = prev.filter((s) => s !== symbol);
          return [symbol, ...filtered].slice(0, 5);
        });
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSymbol", symbol);
    }
    onSymbolChange(symbol);
    fetchMarketData(symbol);
  };

  useEffect(() => {
    fetchMarketData(selectedSymbol);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Market Data</span>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Symbol Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Symbol</label>
          <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a symbol" />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_SYMBOLS.map((item) => (
                <SelectItem key={item.symbol} value={item.symbol}>
                  <div className="flex items-center justify-between w-full">
                    <span>{item.symbol}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recent Symbols */}
        {recentSymbols.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Recent</label>
            <div className="flex flex-wrap gap-2">
              {recentSymbols.map((symbol) => (
                <Badge
                  key={symbol}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleSymbolChange(symbol)}
                >
                  {symbol}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Market Data Display */}
        {/* {marketData && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{marketData.symbol}</span>
              <div className="flex items-center gap-1">
                {marketData.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    marketData.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {marketData.change >= 0 ? "+" : ""}
                  {marketData.change.toFixed(2)} (
                  {marketData.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="text-3xl font-bold">
              ${marketData.price.toFixed(2)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Open:</span>
                <span className="ml-2 font-medium">
                  ${marketData.open.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Volume:</span>
                <span className="ml-2 font-medium">
                  {marketData.volume.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">High:</span>
                <span className="ml-2 font-medium">
                  ${marketData.high.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Low:</span>
                <span className="ml-2 font-medium">
                  ${marketData.low.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
