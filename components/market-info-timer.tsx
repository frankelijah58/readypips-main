"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Shield,
} from "lucide-react";

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

interface MarketInfoTimerProps {
  marketData?: MarketData;
  className?: string;
}

export default function MarketInfoTimer({
  marketData,
  className = "",
}: MarketInfoTimerProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  useEffect(() => {
    // Set initial time only on client side to avoid hydration mismatch
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getChangeColor = (change: number) => {
    return change >= 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Live Timer */}
      <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Market Time
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentTime ? formatTime(currentTime) : "--:--:--"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {currentTime ? formatDate(currentTime) : "-- -- --"}
                </p>
              </div>
            </div>
            <Badge
              variant={isMarketOpen ? "default" : "secondary"}
              className={
                isMarketOpen
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : ""
              }
            >
              {isMarketOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Market Status */}
      <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Market Status
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  Active
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Real-time data
                </p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Current Symbol Info */}
      {marketData && (
        <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {marketData.symbol}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${marketData.price.toFixed(4)}
                  </p>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(marketData.change)}
                    <span
                      className={`text-xs font-medium ${getChangeColor(
                        marketData.change
                      )}`}
                    >
                      {marketData.change >= 0 ? "+" : ""}
                      {marketData.change.toFixed(4)} (
                      {marketData.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  24h High
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ${marketData.high.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  24h Low
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ${marketData.low.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
