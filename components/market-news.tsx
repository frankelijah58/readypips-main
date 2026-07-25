"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Newspaper, ExternalLink, Calendar } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: "positive" | "negative" | "neutral";
  relevance: "high" | "medium" | "low";
}

interface MarketNewsProps {
  symbol: string;
}

export default function MarketNews({ symbol }: MarketNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/news?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      } else {
        throw new Error("Failed to fetch news");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchNews();
    }
  }, [symbol]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "negative":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case "high":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <Newspaper className="h-4 w-4" />
          Market News
        </h4>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <span className="text-sm text-red-700 dark:text-red-300">
            {error}
          </span>
        </div>
      )}

      {news.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
            >
              {/* Title and Badges */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm leading-tight line-clamp-2">
                  {item.title}
                </h4>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    className={`${getSentimentColor(item.sentiment)} text-xs`}
                  >
                    {item.sentiment}
                  </Badge>
                  <Badge
                    className={`${getRelevanceColor(item.relevance)} text-xs`}
                  >
                    {item.relevance}
                  </Badge>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.summary}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1 min-w-0">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {formatDate(item.publishedAt)}
                  </span>
                  <span className="flex-shrink-0">•</span>
                  <span className="truncate">{item.source}</span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors flex-shrink-0 ml-2"
                >
                  <span>Read</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && !error ? (
        <div className="text-center py-6 text-muted-foreground">
          <Newspaper className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No news available for {symbol}</p>
        </div>
      ) : null}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs text-muted-foreground ml-2">
            Loading news...
          </span>
        </div>
      )}
    </div>
  );
}
