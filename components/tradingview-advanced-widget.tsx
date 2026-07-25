"use client";

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewAdvancedWidgetProps {
  symbol?: string;
  interval?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  style?: string;
  locale?: string;
  enable_publishing?: boolean;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
}

/**
 * TradingView Advanced Real-Time Chart Widget
 * This widget provides real-time auto-refreshing data directly from TradingView's feed
 */
function TradingViewAdvancedWidget({ 
  symbol = "OANDA:XAUUSD",
  interval = "1",
  timezone = "Africa/Nairobi",
  theme = "dark",
  style = "1",
  locale = "en",
  enable_publishing = false,
  hide_side_toolbar = false,
  allow_symbol_change = true,
  container_id = "tradingview_advanced"
}: TradingViewAdvancedWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

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
    
    // Clear container
    container.current.innerHTML = `<div id="${container_id}"></div>`;

    // Load TradingView script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;
    
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        try {
          widgetRef.current = new (window as any).TradingView.widget({
            container_id: container_id,
            symbol: symbol,
            interval: interval,
            timezone: timezone,
            theme: theme,
            style: style,
            locale: locale,
            enable_publishing: enable_publishing,
            hide_side_toolbar: hide_side_toolbar,
            allow_symbol_change: allow_symbol_change,
            autosize: true,
            // Additional settings for better performance
            studies: [],
            show_popup_button: true,
            popup_width: "1000",
            popup_height: "650",
            // Real-time data settings
            withdateranges: true,
            hide_top_toolbar: false,
            save_image: true,
            // Background and grid colors
            backgroundColor: theme === 'dark' ? '#0F0F0F' : '#FFFFFF',
            gridColor: theme === 'dark' ? 'rgba(242, 242, 242, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          });
        } catch (error) {
          console.error('Error initializing TradingView widget:', error);
        }
      }
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
  }, [symbol, interval, timezone, theme, style, locale, enable_publishing, hide_side_toolbar, allow_symbol_change, container_id]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ 
        height: "100%", 
        width: "100%" 
      }}
    >
      <div 
        id={container_id}
        style={{ 
          height: "100%", 
          width: "100%" 
        }}
      ></div>
    </div>
  );
}

export default memo(TradingViewAdvancedWidget);
