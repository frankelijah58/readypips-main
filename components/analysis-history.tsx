"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Calendar,
  Clock,
  Eye,
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
} from "lucide-react";

interface AIInsight {
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
}

interface AnalysisHistoryProps {
  analyses: AIInsight[];
  onAnalysisClick: (analysis: AIInsight) => void;
}

export default function AnalysisHistory({
  analyses,
  onAnalysisClick,
}: AnalysisHistoryProps) {
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "bearish":
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <BarChart3 className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (analyses.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Brain className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No analysis history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <BarChart3 className="h-4 w-4" />
          Analysis History ({analyses.length})
        </h4>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {analyses.map((analysis, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            onClick={() => onAnalysisClick(analysis)}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSentimentIcon(analysis.sentiment)}
                <span className="font-medium text-sm">{analysis.strategy}</span>
                <Badge className={getSentimentColor(analysis.sentiment)}>
                  {analysis.sentiment}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>

            {/* Summary */}
            <p className="text-xs text-muted-foreground line-clamp-2">
              {analysis.summary}
            </p>

            {/* Trading Levels Preview */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">Entry</div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  ${analysis.entryPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Stop</div>
                <div className="font-medium text-red-600 dark:text-red-400">
                  ${analysis.stopLoss.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Target</div>
                <div className="font-medium text-blue-600 dark:text-blue-400">
                  ${analysis.takeProfit.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1 min-w-0">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {analysis.timestamp
                    ? formatDate(analysis.timestamp)
                    : "Unknown"}
                </span>
                <span className="flex-shrink-0">•</span>
                <span className="truncate">{analysis.timeframe || "1D"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${getRiskColor(analysis.riskLevel)} text-xs`}
                >
                  {analysis.riskLevel}
                </Badge>
                <span className="text-xs">{analysis.confidence}%</span>
              </div>
            </div>

            {/* Time Ago */}
            {analysis.timestamp && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(analysis.timestamp)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
