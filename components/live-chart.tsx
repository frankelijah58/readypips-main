"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface LiveChartProps {
  pair: string;
}

interface Signal {
  _id: string;
  pair: string;
  signal: 'BUY' | 'SELL';
  entry: number;
  tp: number;
  sl: number;
  createdAt: string;
}

declare global {
  var TradingView: any;
}

export default function LiveChart({ pair }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    try {
      const response = await fetch(`/api/signals?pair=${pair}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSignals(data.signals || []);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  }, [pair]);

  const initializeChart = useCallback(() => {
    if (!containerRef.current || !globalThis.TradingView) return;

    // Clear previous widget
    if (widgetRef.current) {
      containerRef.current.innerHTML = '';
    }

    setLoading(true);

    // Create new widget
    widgetRef.current = new globalThis.TradingView.widget({
      container_id: containerRef.current.id,
      autosize: true,
      symbol: pair === 'XAUUSD' ? 'OANDA:XAUUSD' : `FX:${pair}`,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      hide_top_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      toolbar_bg: '#1a1a1a',
      loading_screen: { backgroundColor: '#1a1a1a', foregroundColor: '#2962FF' },
      disabled_features: ['use_localstorage_for_settings'],
      enabled_features: ['study_templates'],
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#26a69a',
        'mainSeriesProperties.candleStyle.downColor': '#ef5350',
        'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
      },
    });

    setTimeout(() => setLoading(false), 2000);
  }, [pair]);

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      initializeChart();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initializeChart]);

  // Reinitialize chart when pair changes
  useEffect(() => {
    if (globalThis.TradingView) {
      initializeChart();
    }
  }, [pair, initializeChart]);

  // Fetch signals periodically
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [fetchSignals]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Chart Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-white">Loading Chart...</p>
            </div>
          </div>
        )}
        <div
          id="tv_chart_container"
          ref={containerRef}
          style={{ height: '750px', width: '100%' }}
        />
      </div>

      {/* Recent Signals Panel */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Recent Signals for {pair}
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {signals.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No recent signals for this pair
            </p>
          ) : (
            signals.map((signal) => (
              <div
                key={signal._id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  signal.signal === 'BUY'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      signal.signal === 'BUY'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {signal.signal}
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Entry: {signal.entry}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      TP: {signal.tp} | SL: {signal.sl}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(signal.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
