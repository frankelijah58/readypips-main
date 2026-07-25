"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  isFullscreen?: boolean;
  symbol?: string;
}

/**
 * TradingView Advanced Real-Time Chart Widget
 * Uses TradingView's tv.js library for auto-refreshing real-time data
 */
function TradingViewWidget({ isFullscreen = false, symbol = "OANDA:XAUUSD" }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const containerId = useRef(`tradingview_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!container.current) return;

    // Clear any existing widget
    if (widgetRef.current) {
      try {
        widgetRef.current.remove();
      } catch (e) {
        console.warn('Error removing previous widget:', e);
      }
    }
    
    // Clear and set up container
    container.current.innerHTML = `<div id="${containerId.current}" style="height: 100%; width: 100%;"></div>`;

    // Load TradingView script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;
    
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        try {
          widgetRef.current = new (window as any).TradingView.widget({
            container_id: containerId.current,
            symbol: symbol,
            interval: "1", // 1 minute for real-time updates
            timezone: "Africa/Nairobi",
            theme: "dark",
            style: "1",
            locale: "en",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            autosize: true,
            withdateranges: true,
            hide_top_toolbar: false,
            save_image: true,
            hide_legend: false,
            hide_volume: false,
            backgroundColor: "#0F0F0F",
            gridColor: "rgba(242, 242, 242, 0.06)",
            // Enable real-time data features
            studies_overrides: {},
            disabled_features: [],
            enabled_features: ["study_templates"],
          });
        } catch (error) {
          console.error('Error initializing TradingView widget:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load TradingView script');
    };

    document.head.appendChild(script);

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('Error during cleanup:', e);
        }
      }
      // Remove the script when component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isFullscreen, symbol]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ 
        height: isFullscreen ? "100vh" : "100%", 
        width: "100%" 
      }}
    >
    </div>
  );
}

export default memo(TradingViewWidget);
