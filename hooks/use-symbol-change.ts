import { useEffect, useState, useCallback } from 'react';

interface SymbolChangeEvent {
  symbol: string;
  type: string;
}

export function useSymbolChange() {
  const [currentSymbol, setCurrentSymbol] = useState<string>('XAUUSD');
  const [isListening, setIsListening] = useState(false);

  const handleSymbolChange = useCallback((event: CustomEvent<SymbolChangeEvent>) => {
    const { symbol, type } = event.detail;
    // console.log(`🔄 [useSymbolChange] Symbol changed to: ${symbol} (${type})`);
    setCurrentSymbol(symbol);
  }, []);

  useEffect(() => {
    // Listen for custom market change events from TradingView
    window.addEventListener('marketChange', handleSymbolChange as EventListener);
    setIsListening(true);

    return () => {
      window.removeEventListener('marketChange', handleSymbolChange as EventListener);
      setIsListening(false);
    };
  }, [handleSymbolChange]);

  const updateSymbol = useCallback((symbol: string) => {
    setCurrentSymbol(symbol);
  }, []);

  return {
    currentSymbol,
    isListening,
    updateSymbol
  };
}
