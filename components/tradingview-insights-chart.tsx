"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";

// Import from the standalone library
declare global {
  interface Window {
    TradingView: any;
    Datafeeds: any;
  }
}

type TradingViewSettings = {
  isDarkMode: boolean;
  interval: string;
  symbol: string;
};

const getLanguageFromURL = (): string => {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(location.search);
  return results === null
    ? "en"
    : decodeURIComponent(results[1].replace(/\+/g, " "));
};

const loadSettings = (): TradingViewSettings => {
  if (typeof window === "undefined") {
    // Server-side rendering - return defaults
    return {
      isDarkMode: true,
      interval: "1D",
      symbol: "frxEURGBP",
    };
  }

  const savedSettings = localStorage.getItem("tradingViewSettings");
  const defaults: TradingViewSettings = {
    isDarkMode: true,
    interval: "1D",
    symbol: "frxEURGBP",
  };

  const settings = savedSettings ? JSON.parse(savedSettings) : defaults;
  // console.log("📂 [TradingView] Loading settings from localStorage:", settings);

  return settings;
};

const saveSettings = (settings: TradingViewSettings) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("tradingViewSettings", JSON.stringify(settings));
  }
};

export default function TradingViewInsightsChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [chartReady, setChartReady] = useState(false);
  const [settings, setSettings] = useState<TradingViewSettings>(() => {
    // console.log(
    //   "📂 [TradingView] Loading settings from localStorage (lazy init)"
    // );
    return loadSettings();
  });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Load scripts if not already loaded
  const loadScripts = useCallback(async () => {
    if (!window.TradingView) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/charting_library.standalone.js";
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    }

    if (!window.Datafeeds) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/datafeed.js";
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    }
  }, []);

  // Initialize datafeed
  const initDatafeed = useCallback(() => {
    if (!window.Datafeeds) {
      throw new Error("Datafeeds not loaded");
    }
    return new window.Datafeeds.UDFCompatibleDatafeed();
  }, []);

  // Update theme
  const updateTheme = useCallback((isDarkMode: boolean) => {
    // console.log(
    //   "🔄 [TradingView] Updating theme to:",
    //   isDarkMode ? "Dark" : "Light"
    // );
    settingsRef.current.isDarkMode = isDarkMode;

    if (widgetRef.current && isInitializedRef.current) {
      try {
        // Check if the widget has the changeTheme method
        if (typeof widgetRef.current.changeTheme === "function") {
          widgetRef.current.changeTheme(isDarkMode ? "dark" : "light");
        } else {
          console.warn("⚠️ [TradingView] changeTheme method not available yet");
        }
      } catch (error) {
        console.error("❌ [TradingView] Error changing theme:", error);
      }
    }

    saveSettings(settingsRef.current);
  }, []);

  // Add event listeners
  const addEventListeners = useCallback(
    (widget: any) => {
      // Listen for market changes
      window.addEventListener("changeMarket", (event: any) => {
        const { symbol: newSymbol } = event.detail;
        // console.log(
        //   "📈 [TradingView] Received changeMarket event with symbol:",
        //   newSymbol
        // );

        if (widget) {
          widget.setSymbol(newSymbol, settingsRef.current.interval);
          settingsRef.current.symbol = newSymbol;
          saveSettings(settingsRef.current);
        }
      });

      // Listen for theme changes
      window.addEventListener("toggleDarkMode", (event: any) => {
        const { isDarkMode } = event.detail;
        // console.log(
        //   "🎨 [TradingView] Received toggleDarkMode event:",
        //   isDarkMode ? "dark" : "light"
        // );
        updateTheme(isDarkMode);
      });

      // Listen for storage changes (theme changes from other tabs)
      window.addEventListener("storage", (event) => {
        if (event.key === "theme") {
          const newTheme = event.newValue;
          if (newTheme) {
            updateTheme(newTheme === "dark");
          }
        }
      });
    },
    [updateTheme]
  );

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      // console.log("🔄 [TradingView] Widget already initialized, skipping...");
      return;
    }

    const initWidget = async () => {
      try {
        // console.log("🚀 [TradingView] Initializing widget...");
        isInitializedRef.current = true;

        await loadScripts();

        // Ensure container exists
        if (!chartContainerRef.current) {
          throw new Error("Chart container not found");
        }

        // Initialize global TradingView settings
        (window as any).TradingView = (window as any).TradingView || {};

        // Set the resolution directly as in the Vue implementation
        (window as any).TradingView.actualResolution =
          settingsRef.current.interval;
        (window as any).TradingView.currentlyDisplayedSymbol =
          settingsRef.current.symbol;

        // console.log(
        //   "🔧 [TradingView] Setting actualResolution to:",
        //   settingsRef.current.interval
        // );

        // Initialize datafeed
        const datafeed = initDatafeed();

        const widgetOptions = {
          symbol: settingsRef.current.symbol,
          datafeed: datafeed,
          interval: settingsRef.current.interval,
          container: chartContainerRef.current,
          library_path: "/charting_library/",
          locale: getLanguageFromURL(),
          theme: settingsRef.current.isDarkMode ? "dark" : "light",
          timezone: "Etc/UTC",
          debug: false,
          fullscreen: false,
          autosize: true,
          disabled_features: [
            "volume_force_overlay",
            "create_volume_indicator_by_default",
            "study_templates",
          ],
          enabled_features: [
            "show_symbol_logos",
            "display_market_status",
            "side_toolbar_in_fullscreen_mode",
          ],
          charts_storage_url: "https://saveload.tradingview.com",
          charts_storage_api_version: "1.1",
          client_id: "tradingview.com",
          user_id: "public_user_id",
          studies_overrides: {},
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
          },
          time_frames: [
            { text: "1m", resolution: "1" },
            { text: "2m", resolution: "2" },
            { text: "3m", resolution: "3" },
            { text: "5m", resolution: "5" },
            { text: "10m", resolution: "10" },
            { text: "15m", resolution: "15" },
            { text: "30m", resolution: "30" },
            { text: "1h", resolution: "60" },
            { text: "2h", resolution: "120" },
            { text: "4h", resolution: "240" },
            { text: "8h", resolution: "480" },
            { text: "1D", resolution: "D" },
          ],
          save_load_adapter: {
            charts:
              typeof window !== "undefined" && localStorage.getItem("charts")
                ? JSON.parse(localStorage.getItem("charts")!)
                : [],
            studyTemplates: [],
            drawingTemplates: [],
            getAllCharts: function () {
              return Promise.resolve(this.charts);
            },
            removeChart: function (chartId: string) {
              if (typeof window !== "undefined") {
                this.charts = localStorage.getItem("charts")
                  ? JSON.parse(localStorage.getItem("charts")!)
                  : [];
                for (let i = 0; i < this.charts.length; ++i) {
                  if (this.charts[i].id === chartId) {
                    this.charts.splice(i, 1);
                    localStorage.setItem("charts", JSON.stringify(this.charts));
                    return Promise.resolve();
                  }
                }
                localStorage.setItem("charts", JSON.stringify(this.charts));
              }
              return Promise.reject();
            },
            saveChart: function (chart: any) {
              if (typeof window !== "undefined") {
                this.charts = localStorage.getItem("charts")
                  ? JSON.parse(localStorage.getItem("charts")!)
                  : [];
                if (chart.id) {
                  this.removeChart(chart.id);
                } else {
                  chart.id = Math.random().toString();
                }
                chart.timestamp = new Date().valueOf();
                this.charts.push(chart);
                localStorage.setItem("charts", JSON.stringify(this.charts));
                return chart.id;
              }
              return null;
            },
            getChartContent: function (chartId: string) {
              if (typeof window !== "undefined") {
                this.charts = localStorage.getItem("charts")
                  ? JSON.parse(localStorage.getItem("charts")!)
                  : [];
                for (let i = 0; i < this.charts.length; ++i) {
                  if (this.charts[i].id === chartId) {
                    return Promise.resolve(this.charts[i].content);
                  }
                }
              }
              return Promise.reject();
            },
          },
        };

        // console.log(
        //   "⚙️ [TradingView] Creating widget with options:",
        //   widgetOptions
        // );
        const tvWidget = new window.TradingView.widget(widgetOptions);
        widgetRef.current = tvWidget;

        tvWidget.onChartReady(() => {
          // console.log("✅ [TradingView] Chart is ready");
          setChartReady(true);

          // Subscribe to interval changes
          tvWidget
            .activeChart()
            .onIntervalChanged()
            .subscribe(null, (newInterval: string) => {
              // console.log("⏱️ [TradingView] Interval changed to:", newInterval);

              // Extract the numeric part from the interval (remove "m" suffix)
              // The widget passes "5m" but we want to save "5"
              const numericInterval = newInterval
                .replace("m", "")
                .replace("h", "")
                .replace("D", "");

              // Set the resolution directly as in the Vue implementation
              (window as any).TradingView.actualResolution = numericInterval;

              // console.log(
              //   "🔧 [TradingView] Updating actualResolution to:",
              //   numericInterval,
              //   "from:",
              //   newInterval
              // );

              settingsRef.current.interval = numericInterval;
              saveSettings(settingsRef.current);
            });

          // Subscribe to symbol changes
          tvWidget
            .activeChart()
            .onSymbolChanged()
            .subscribe(null, (symbolInfo: any) => {
              const newSymbol = symbolInfo.name;
              const newType = symbolInfo.type;
              // console.log(
              //   "📊 [TradingView] Symbol changed to:",
              //   newSymbol,
              //   "Type:",
              //   newType
              // );

              (window as any).TradingView.currentlyDisplayedSymbol = newSymbol;
              settingsRef.current.symbol = newSymbol;
              saveSettings(settingsRef.current);

              // Dispatch custom event for market change
              const marketChangeEvent = new CustomEvent("marketChange", {
                detail: { symbol: newSymbol, type: newType },
              });
              // console.log(
              //   "📡 [TradingView] Dispatching marketChange event:",
              //   newSymbol,
              //   newType
              // );
              window.dispatchEvent(marketChangeEvent);
            });

          // Apply theme immediately after chart is ready
          updateTheme(settingsRef.current.isDarkMode);
        });

        // Add event listeners
        addEventListeners(tvWidget);

        return tvWidget;
      } catch (error) {
        console.error("❌ [TradingView] Error initializing widget:", error);
        isInitializedRef.current = false; // Reset flag on error
        setChartReady(false); // Reset chart ready state
        throw error;
      }
    };

    let tvWidget: any;
    initWidget().then((widget) => {
      tvWidget = widget;
    });

    return () => {
      if (tvWidget) {
        // console.log("🧹 [TradingView] Cleaning up widget");
        saveSettings(settingsRef.current);
        tvWidget.remove();
        widgetRef.current = null;
        isInitializedRef.current = false; // Reset flag on cleanup
        setChartReady(false); // Reset chart ready state
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="w-full h-[600px] border rounded-lg">
      <div
        ref={chartContainerRef}
        className="h-full w-full"
        style={{ position: "relative" }}
      />
      <div className="text-sm text-muted-foreground mt-2">
        Chart Status: {chartReady ? "Ready" : "Loading..."}
      </div>
    </div>
  );
} 