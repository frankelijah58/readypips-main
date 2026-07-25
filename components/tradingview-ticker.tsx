"use client";

import React, { useEffect, useRef, memo } from "react";

function TradingViewTicker() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          {
            "proName": "BINANCE:BTCUSDT",
            "title": "Bitcoin"
          },
          {
            "proName": "BINANCE:ETHUSDT",
            "title": "Ethereum"
          },
          {
            "proName": "FX_IDC:EURUSD",
            "title": "EUR/USD"
          },
          {
            "proName": "FX_IDC:GBPUSD",
            "title": "GBP/USD"
          },
          {
            "proName": "NASDAQ:AAPL",
            "title": "Apple"
          },
          {
            "proName": "NASDAQ:TSLA",
            "title": "Tesla"
          },
          {
            "proName": "NASDAQ:NVDA",
            "title": "NVIDIA"
          },
          {
            "proName": "FX_IDC:USDJPY",
            "title": "USD/JPY"
          },
          {
            "proName": "FX_IDC:USDCAD",
            "title": "USD/CAD"
          },
          {
            "proName": "BINANCE:SOLUSDT",
            "title": "Solana"
          }
        ],
        "colorTheme": "auto",
        "locale": "en",
        "isTransparent": false,
        "showSymbolLogo": true,
        "displayMode": "adaptive"
      }`;

    // Clear any existing content
    if (container.current) {
      container.current.innerHTML = "";
    }
    //testing
    // Create the widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    container.current.appendChild(widgetContainer);

    // Append the script
    container.current.appendChild(script);

    // Cleanup function
    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(TradingViewTicker);
