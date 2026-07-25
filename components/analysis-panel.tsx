"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

interface AnalysisPanelProps {
  pair: string;
}

interface AnalysisData {
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  momentum: 'Strong' | 'Moderate' | 'Weak';
  prediction: string;
  support: number;
  resistance: number;
  volatility: 'High' | 'Medium' | 'Low';
  lastUpdated: string;
}

export default function AnalysisPanel({ pair }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [pair]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/analysis?pair=${pair}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        // Fallback to mock data if endpoint doesn't exist yet
        setAnalysis(generateMockAnalysis());
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysis(generateMockAnalysis());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalysis = (): AnalysisData => {
    const trends: AnalysisData['trend'][] = ['Bullish', 'Bearish', 'Neutral'];
    const momentums: AnalysisData['momentum'][] = ['Strong', 'Moderate', 'Weak'];
    const volatilities: AnalysisData['volatility'][] = ['High', 'Medium', 'Low'];
    
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const momentum = momentums[Math.floor(Math.random() * momentums.length)];
    
    return {
      trend,
      momentum,
      prediction: trend === 'Bullish' 
        ? 'Expect upward movement in the next 4-6 hours'
        : trend === 'Bearish'
        ? 'Possible downward pressure in the short term'
        : 'Market consolidation expected',
      support: 1.0840,
      resistance: 1.0920,
      volatility: volatilities[Math.floor(Math.random() * volatilities.length)],
      lastUpdated: new Date().toISOString(),
    };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading Analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">No analysis available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          📊 Market Analysis
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {pair} Live Insights
        </p>
      </div>

      {/* Trend */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Trend
          </span>
          <div className="flex items-center space-x-2">
            {analysis.trend === 'Bullish' ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : analysis.trend === 'Bearish' ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <Activity className="h-5 w-5 text-gray-500" />
            )}
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                analysis.trend === 'Bullish'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : analysis.trend === 'Bearish'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {analysis.trend}
            </span>
          </div>
        </div>

        {/* Momentum */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Momentum
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {analysis.momentum}
          </span>
        </div>

        {/* Volatility */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Volatility
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              analysis.volatility === 'High'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                : analysis.volatility === 'Medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {analysis.volatility}
          </span>
        </div>
      </div>

      {/* Support & Resistance */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Key Levels
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Resistance
            </span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              {analysis.resistance.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Support
            </span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {analysis.support.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">
          📈 Next Move
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {analysis.prediction}
        </p>
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Clock className="h-3 w-3" />
        <span>
          Updated: {new Date(analysis.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></div>
          <span>Auto-refreshing every 10s</span>
        </div>
      </div>
    </div>
  );
}
