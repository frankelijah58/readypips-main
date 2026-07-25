"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";

interface AnalysisRecord {
  _id: string;
  publicId: string;
  symbol: string;
  timeframe: string;
  createdAt: string;
  parseStatus: string;
  confidenceScore: string | number;
  direction: string;
  entryPrice: string | number;
  fullAnalysis?: string;
}

interface Metrics {
  timestamp: string;
  totalAnalyses: number;
  parseMetrics: {
    successes: number;
    failures: number;
    successRate: string;
  };
  confidence: {
    average: string;
    sampledFrom: number;
  };
  topSymbols: Array<{ _id: string; count: number }>;
  strategiesUsed: Array<{ _id: string; count: number }>;
  status: string;
}

export default function AdminAIInsights() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch metrics
      const metricsRes = await fetch("/api/ai-insights/metrics");
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }

      // Fetch recent analyses
      const analysesRes = await fetch("/api/ai-insights/recent?limit=20&includeRaw=true");
      if (analysesRes.ok) {
        const data = await analysesRes.json();
        setAnalyses(data.analyses || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const downloadMetrics = () => {
    if (!metrics) return;
    const json = JSON.stringify({ metrics, analyses }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-insights-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Insights Admin Dashboard
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={downloadMetrics}
              variant="outline"
              size="sm"
              disabled={!metrics}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Metrics Section */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Analyses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalAnalyses}
                </div>
              </CardContent>
            </Card>

            {/* Parse Success Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Parse Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {metrics.parseMetrics.successRate}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {metrics.parseMetrics.successes} ✓ / {metrics.parseMetrics.failures} ✗
                </p>
              </CardContent>
            </Card>

            {/* Avg Confidence */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {metrics.confidence.average}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  From {metrics.confidence.sampledFrom} records
                </p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className={metrics.parseMetrics.failures === 0 ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {metrics.parseMetrics.failures === 0 ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  )}
                  <span className="text-sm font-semibold">
                    {metrics.parseMetrics.failures === 0 ? "Healthy" : `${metrics.parseMetrics.failures} Issues`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Symbols */}
        {metrics && metrics.topSymbols.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Most Analyzed Symbols</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.topSymbols.map((symbol) => (
                  <div
                    key={symbol._id}
                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {symbol._id}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {symbol.count} analyses
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Analyses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No analyses found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Symbol
                      </th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Strategy
                      </th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Direction
                      </th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Confidence
                      </th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Entry
                      </th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((analysis) => (
                      <tr
                        key={analysis._id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                        onClick={() =>
                          setExpandedId(expandedId === analysis._id ? null : analysis._id)
                        }
                      >
                        <td className="py-2 px-2 font-semibold text-blue-600 dark:text-blue-400">
                          {analysis.symbol}
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                          {analysis.timeframe}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                              analysis.parseStatus.includes("✅")
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {analysis.parseStatus}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`inline-block w-12 text-center px-2 py-1 rounded text-xs font-semibold ${
                              analysis.direction === "Long"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : analysis.direction === "Short"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            }`}
                          >
                            {analysis.direction}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                          {analysis.confidenceScore}%
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                          ${analysis.entryPrice}
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                          {new Date(analysis.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Expanded Details */}
                {expandedId && (
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Full Analysis Preview (ID: {expandedId})
                    </div>
                    <pre className="text-xs overflow-auto max-h-64 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                      {analyses
                        .find((a) => a._id === expandedId)
                        ?.fullAnalysis || "No data"}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <p>
            This admin dashboard monitors AI Insights API health. Metrics refresh every 30
            seconds. Parse failures indicate times when Gemini returned non-JSON or malformed
            responses that were captured as raw text for debugging.
          </p>
        </div>
      </div>
    </div>
  );
}
