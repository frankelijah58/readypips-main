"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  X,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Brain,
  DollarSign,
  Shield,
  Zap,
} from "lucide-react";

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
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AIInsight | null;
  marketData?: any;
  indicators?: TechnicalIndicators;
}

export default function AnalysisModal({
  isOpen,
  onClose,
  analysis,
  marketData,
  indicators,
}: AnalysisModalProps) {
  if (!analysis) return null;

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
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "bearish":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none rounded-none sm:max-w-4xl sm:max-h-[90vh] sm:rounded-lg overflow-hidden p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Analysis Results
                </DialogTitle>
              </div>
              <Badge
                variant="outline"
                className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
              >
                {analysis.symbol}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{analysis.strategy}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {analysis.timeframe || "1D"} Timeframe
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">
                    {analysis.confidence}%
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Risk Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  className={`${getRiskColor(analysis.riskLevel)} text-sm`}
                >
                  {analysis.riskLevel.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getSentimentIcon(analysis.sentiment)}
                Market Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* Key Points */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-lg">Key Analysis Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-muted-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Trading Levels */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Trading Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.marketOverview ? (
                <div className="space-y-4">
                  {/* Market Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        Direction
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {analysis.marketOverview.direction}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        Entry
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${analysis.marketOverview.entryPoint.toFixed(4)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        Risk
                      </div>
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {analysis.marketOverview.riskPercentage}%
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        R:R Ratio
                      </div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {analysis.marketOverview.riskRewardRatio.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Take Profit Levels */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        TP1
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${analysis.marketOverview.takeProfits.tp1.toFixed(4)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        TP2
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ${analysis.marketOverview.takeProfits.tp2.toFixed(4)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        TP3
                      </div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ${analysis.marketOverview.takeProfits.tp3.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Confidence Score
                      </span>
                      <span className="text-lg font-bold">
                        {analysis.marketOverview.confidenceScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${analysis.marketOverview.confidenceScore}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm text-muted-foreground mb-1">
                      Entry Price
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${analysis.entryPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-sm text-muted-foreground mb-1">
                      Stop Loss
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ${analysis.stopLoss.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-muted-foreground mb-1">
                      Take Profit
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${analysis.takeProfit.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Analysis */}
          {analysis.technicalAnalysis && (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg">Technical Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Support & Resistance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Support:</span>
                        <span className="font-medium">
                          ${analysis.technicalAnalysis.support.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Resistance:
                        </span>
                        <span className="font-medium">
                          ${analysis.technicalAnalysis.resistance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trend:</span>
                        <span className="font-medium">
                          {analysis.technicalAnalysis.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Indicators</h4>
                    <div className="space-y-1">
                      {analysis.technicalAnalysis.indicators.map(
                        (indicator, index) => (
                          <div
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            • {indicator}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendation */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                Trading Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {analysis.recommendation}
              </p>
            </CardContent>
          </Card>

          {/* Analysis Categories */}
          {analysis.analysis?.categories && (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Multi-Timeframe Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analysis.analysis.categories).map(
                    ([category, data]: [string, any]) => (
                      <div
                        key={category}
                        className="border-l-4 border-primary pl-4"
                      >
                        <h4 className="font-semibold capitalize mb-2">
                          {category.replace("_", " ")}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {data.timeframes?.map((tf: string) => (
                              <Badge
                                key={tf}
                                variant="outline"
                                className="text-xs"
                              >
                                {tf}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {data.summary}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Indicators */}
          {analysis.analysis?.key_indicators && (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Technical Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.analysis.key_indicators.map(
                    (indicator: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {indicator}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Psychological Levels */}
          {analysis.analysis?.psychological_levels && (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Psychological Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600 dark:text-green-400">
                      Support Levels
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.analysis.psychological_levels.support}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600 dark:text-red-400">
                      Resistance Levels
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.analysis.psychological_levels.resistance}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {analysis.implementation?.simulation_steps && (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Implementation Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.implementation.simulation_steps.map((step: any) => (
                    <div
                      key={step.step}
                      className="border-l-4 border-primary pl-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Step {step.step}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-sm">
                            Condition:
                          </span>
                          <p className="text-sm text-muted-foreground ml-2">
                            {step.condition}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-sm">Action:</span>
                          <p className="text-sm text-muted-foreground ml-2">
                            {step.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Rationale */}
          {analysis.technical_rationale && (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Technical Rationale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Trend Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.technical_rationale.trend_analysis}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Volume Confirmation</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.technical_rationale.volume_confirmation}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">
                      Risk/Reward Calculation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.technical_rationale.reward_risk_calculation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contingency Scenarios */}
          {analysis.contingency_scenarios && (
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Contingency Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.contingency_scenarios.map(
                    (scenario: any, index: number) => (
                      <div
                        key={index}
                        className="border-l-4 border-orange-500 pl-4"
                      >
                        <h4 className="font-semibold mb-2">
                          {scenario.scenario}
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <span className="font-semibold text-sm">
                              Condition:
                            </span>
                            <p className="text-sm text-muted-foreground ml-2">
                              {scenario.condition}
                            </p>
                          </div>
                          {scenario.approach && (
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold text-sm">
                                  Direction:
                                </span>
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  {scenario.approach.direction}
                                </Badge>
                              </div>
                              {scenario.approach.entry_level && (
                                <div>
                                  <span className="font-semibold text-sm">
                                    Entry Level:
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {scenario.approach.entry_level}
                                  </span>
                                </div>
                              )}
                              {scenario.approach.target_level && (
                                <div>
                                  <span className="font-semibold text-sm">
                                    Target Level:
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {scenario.approach.target_level}
                                  </span>
                                </div>
                              )}
                              {scenario.approach.invalidation_level && (
                                <div>
                                  <span className="font-semibold text-sm">
                                    Invalidation Level:
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {scenario.approach.invalidation_level}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-sm">
                                  Reasoning:
                                </span>
                                <p className="text-sm text-muted-foreground ml-2">
                                  {scenario.approach.reason}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamp */}
          {analysis.timestamp && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Analysis performed on{" "}
                {new Date(analysis.timestamp).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
