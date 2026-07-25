'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  interval?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewChart({ 
  symbol = 'FX:EURUSD',
  width = '100%',
  height = 400,
  theme = 'dark',
  interval = '15'
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: width,
      height: height,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)',
      gridColor: theme === 'dark' ? 'rgba(42, 46, 57, 0.5)' : 'rgba(230, 236, 243, 0.5)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: 'tradingview_chart',
      studies: [
        'RSI@tv-basicstudies',
        'MASimple@tv-basicstudies',
        'MACD@tv-basicstudies',
      ],
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, width, height, theme, interval]);

  return (
    <div className="chart-container">
      <div
        ref={containerRef}
        id="tradingview_chart"
        className="w-full h-full"
      />
    </div>
  );
}