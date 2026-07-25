// Harmonic Pattern Trading Strategy - JavaScript Version
// Converted from Pine Script for TradingView Advanced Charts

class HarmonicPatternStrategy {
    constructor(options = {}) {
        // Configuration options
        this.config = {
            useHA: options.useHA || false,
            useAltTF: options.useAltTF || true,
            tf: options.tf || 60,
            showPatterns: options.showPatterns || true,
            showFib: {
                "0.000": options.showFib0000 !== false,
                "0.236": options.showFib0236 !== false,
                "0.382": options.showFib0382 !== false,
                "0.500": options.showFib0500 !== false,
                "0.618": options.showFib0618 !== false,
                "0.764": options.showFib0764 !== false,
                "1.000": options.showFib1000 !== false
            },
            initialCapital: options.initialCapital || 100000,
            tradeSize: options.tradeSize || 10000,
            ewRate: options.ewRate || 0.382,
            tpRate: options.tpRate || 0.618,
            slRate: options.slRate || -0.618
        };

        // Trading state
        this.state = {
            inBuyTrade: false,
            inSellTrade: false,
            buyBarIndex: null,
            sellBarIndex: null,
            buyTpLevel: null,
            buySlLevel: null,
            sellTpLevel: null,
            sellSlLevel: null,
            zigzagPoints: [],
            lastPatternPoints: { x: null, a: null, b: null, c: null, d: null }
        };

        // Pattern recognition results
        this.patterns = {
            bullish: [],
            bearish: []
        };
    }

    // Utility function to calculate absolute value
    abs(value) {
        return Math.abs(value);
    }

    // ZigZag calculation
    calculateZigzag(candles) {
        const zigzagPoints = [];
        let direction = 0;
        
        for (let i = 1; i < candles.length; i++) {
            const current = candles[i];
            const previous = candles[i - 1];
            
            const isUp = current.close >= current.open;
            const isDown = current.close <= current.open;
            const wasUp = previous.close >= previous.open;
            const wasDown = previous.close <= previous.open;
            
            if (wasUp && isDown && direction !== -1) {
                direction = -1;
                zigzagPoints.push({ index: i - 1, value: previous.high, type: 'high' });
            } else if (wasDown && isUp && direction !== 1) {
                direction = 1;
                zigzagPoints.push({ index: i - 1, value: previous.low, type: 'low' });
            }
        }
        
        return zigzagPoints;
    }

    // Get the last N zigzag values
    getLastZigzagValues(zigzagPoints, n) {
        const values = [];
        const len = zigzagPoints.length;
        
        for (let i = 0; i < n && i < len; i++) {
            values.push(zigzagPoints[len - 1 - i]?.value || null);
        }
        
        return values.reverse(); // Return in chronological order
    }

    // Calculate Fibonacci ratios
    calculateRatios(x, a, b, c, d) {
        const xab = this.abs(b - a) / this.abs(x - a);
        const xad = this.abs(a - d) / this.abs(x - a);
        const abc = this.abs(b - c) / this.abs(a - b);
        const bcd = this.abs(c - d) / this.abs(b - c);
        
        return { xab, xad, abc, bcd };
    }

    // Pattern recognition functions
    isBat(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.382 && xab <= 0.5;
        const abcValid = abc >= 0.382 && abc <= 0.886;
        const bcdValid = bcd >= 1.618 && bcd <= 2.618;
        const xadValid = xad <= 0.618 && xad <= 1.000;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isAntiBat(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.500 && xab <= 0.886;
        const abcValid = abc >= 1.000 && abc <= 2.618;
        const bcdValid = bcd >= 1.618 && bcd <= 2.618;
        const xadValid = xad >= 0.886 && xad <= 1.000;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isAltBat(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab <= 0.382;
        const abcValid = abc >= 0.382 && abc <= 0.886;
        const bcdValid = bcd >= 2.0 && bcd <= 3.618;
        const xadValid = xad <= 1.13;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isButterfly(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab <= 0.786;
        const abcValid = abc >= 0.382 && abc <= 0.886;
        const bcdValid = bcd >= 1.618 && bcd <= 2.618;
        const xadValid = xad >= 1.27 && xad <= 1.618;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isAntiButterfly(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.236 && xab <= 0.886;
        const abcValid = abc >= 1.130 && abc <= 2.618;
        const bcdValid = bcd >= 1.000 && bcd <= 1.382;
        const xadValid = xad >= 0.500 && xad <= 0.886;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isABCD(mode, ratios) {
        const { abc, bcd } = ratios;
        const abcValid = abc >= 0.382 && abc <= 0.886;
        const bcdValid = bcd >= 1.13 && bcd <= 2.618;
        
        return abcValid && bcdValid;
    }

    isGartley(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.5 && xab <= 0.618;
        const abcValid = abc >= 0.382 && abc <= 0.886;
        const bcdValid = bcd >= 1.13 && bcd <= 2.618;
        const xadValid = xad >= 0.75 && xad <= 0.875;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isAntiGartley(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.500 && xab <= 0.886;
        const abcValid = abc >= 1.000 && abc <= 2.618;
        const bcdValid = bcd >= 1.500 && bcd <= 5.000;
        const xadValid = xad >= 1.000 && xad <= 5.000;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isCrab(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.500 && xab <= 0.875;
        const abcValid = abc >= 0.382 && abc <= 0.886;
        const bcdValid = bcd >= 2.000 && bcd <= 5.000;
        const xadValid = xad >= 1.382 && xad <= 5.000;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isAntiCrab(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.250 && xab <= 0.500;
        const abcValid = abc >= 1.130 && abc <= 2.618;
        const bcdValid = bcd >= 1.618 && bcd <= 2.618;
        const xadValid = xad >= 0.500 && xad <= 0.750;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isShark(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.500 && xab <= 0.875;
        const abcValid = abc >= 1.130 && abc <= 1.618;
        const bcdValid = bcd >= 1.270 && bcd <= 2.240;
        const xadValid = xad >= 0.886 && xad <= 1.130;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isAntiShark(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.382 && xab <= 0.875;
        const abcValid = abc >= 0.500 && abc <= 1.000;
        const bcdValid = bcd >= 1.250 && bcd <= 2.618;
        const xadValid = xad >= 0.500 && xad <= 1.250;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    is5o(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 1.13 && xab <= 1.618;
        const abcValid = abc >= 1.618 && abc <= 2.24;
        const bcdValid = bcd >= 0.5 && bcd <= 0.625;
        const xadValid = xad >= 0.0 && xad <= 0.236;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isWolf(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 1.27 && xab <= 1.618;
        const abcValid = abc >= 0 && abc <= 5;
        const bcdValid = bcd >= 1.27 && bcd <= 1.618;
        const xadValid = xad >= 0.0 && xad <= 5;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isHnS(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 2.0 && xab <= 10;
        const abcValid = abc >= 0.90 && abc <= 1.1;
        const bcdValid = bcd >= 0.236 && bcd <= 0.88;
        const xadValid = xad >= 0.90 && xad <= 1.1;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isConTria(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 0.382 && xab <= 0.618;
        const abcValid = abc >= 0.382 && abc <= 0.618;
        const bcdValid = bcd >= 0.382 && bcd <= 0.618;
        const xadValid = xad >= 0.236 && xad <= 0.764;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    isExpTria(mode, ratios) {
        const { xab, abc, bcd, xad } = ratios;
        const xabValid = xab >= 1.236 && xab <= 1.618;
        const abcValid = abc >= 1.000 && abc <= 1.618;
        const bcdValid = bcd >= 1.236 && bcd <= 2.000;
        const xadValid = xad >= 2.000 && xad <= 2.236;
        
        return xabValid && abcValid && bcdValid && xadValid;
    }

    // Calculate Fibonacci level
    calculateFibLevel(d, c, rate) {
        const fibRange = this.abs(d - c);
        return d > c ? d - fibRange * rate : d + fibRange * rate;
    }

    // Main pattern recognition function
    recognizePatterns(x, a, b, c, d) {
        const ratios = this.calculateRatios(x, a, b, c, d);
        const patterns = [];

        // Check for bullish patterns (mode = 1, d < c)
        if (d < c) {
            const patternChecks = [
                { name: 'ABCD', func: this.isABCD },
                { name: 'Bat', func: this.isBat },
                { name: 'Alt Bat', func: this.isAltBat },
                { name: 'Butterfly', func: this.isButterfly },
                { name: 'Gartley', func: this.isGartley },
                { name: 'Crab', func: this.isCrab },
                { name: 'Shark', func: this.isShark },
                { name: '5-0', func: this.is5o },
                { name: 'Wolf', func: this.isWolf },
                { name: 'Head and Shoulders', func: this.isHnS },
                { name: 'Contracting Triangle', func: this.isConTria },
                { name: 'Expanding Triangle', func: this.isExpTria },
                { name: 'Anti Bat', func: this.isAntiBat },
                { name: 'Anti Butterfly', func: this.isAntiButterfly },
                { name: 'Anti Gartley', func: this.isAntiGartley },
                { name: 'Anti Crab', func: this.isAntiCrab },
                { name: 'Anti Shark', func: this.isAntiShark }
            ];

            patternChecks.forEach(pattern => {
                if (pattern.func.call(this, 1, ratios)) {
                    patterns.push({ name: pattern.name, type: 'bullish', ratios, points: { x, a, b, c, d } });
                }
            });
        }

        // Check for bearish patterns (mode = -1, d > c)
        if (d > c) {
            const patternChecks = [
                { name: 'ABCD', func: this.isABCD },
                { name: 'Bat', func: this.isBat },
                { name: 'Alt Bat', func: this.isAltBat },
                { name: 'Butterfly', func: this.isButterfly },
                { name: 'Gartley', func: this.isGartley },
                { name: 'Crab', func: this.isCrab },
                { name: 'Shark', func: this.isShark },
                { name: '5-0', func: this.is5o },
                { name: 'Wolf', func: this.isWolf },
                { name: 'Head and Shoulders', func: this.isHnS },
                { name: 'Contracting Triangle', func: this.isConTria },
                { name: 'Expanding Triangle', func: this.isExpTria },
                { name: 'Anti Bat', func: this.isAntiBat },
                { name: 'Anti Butterfly', func: this.isAntiButterfly },
                { name: 'Anti Gartley', func: this.isAntiGartley },
                { name: 'Anti Crab', func: this.isAntiCrab },
                { name: 'Anti Shark', func: this.isAntiShark }
            ];

            patternChecks.forEach(pattern => {
                if (pattern.func.call(this, -1, ratios)) {
                    patterns.push({ name: pattern.name, type: 'bearish', ratios, points: { x, a, b, c, d } });
                }
            });
        }

        return patterns;
    }

    // Main analysis function
    analyze(candles) {
        // Calculate zigzag
        const zigzagPoints = this.calculateZigzag(candles);
        
        if (zigzagPoints.length < 5) {
            return {
                signals: [],
                patterns: [],
                fibLevels: [],
                tradingState: this.state
            };
        }

        // Get last 5 zigzag values
        const lastValues = this.getLastZigzagValues(zigzagPoints, 5);
        const [x, a, b, c, d] = lastValues;

        if (!x || !a || !b || !c || !d) {
            return {
                signals: [],
                patterns: [],
                fibLevels: [],
                tradingState: this.state
            };
        }

        // Update pattern points
        this.state.lastPatternPoints = { x, a, b, c, d };

        // Recognize patterns
        const patterns = this.recognizePatterns(x, a, b, c, d);

        // Calculate Fibonacci levels
        const fibLevels = {};
        Object.keys(this.config.showFib).forEach(rate => {
            if (this.config.showFib[rate]) {
                fibLevels[rate] = this.calculateFibLevel(d, c, parseFloat(rate));
            }
        });

        // Generate trading signals
        const signals = this.generateSignals(patterns, candles[candles.length - 1], d, c);

        return {
            signals,
            patterns,
            fibLevels,
            tradingState: this.state,
            zigzagPoints
        };
    }

    // Generate trading signals
    generateSignals(patterns, currentCandle, d, c) {
        const signals = [];
        
        // Check for bullish patterns
        const bullishPatterns = patterns.filter(p => p.type === 'bullish');
        const bearishPatterns = patterns.filter(p => p.type === 'bearish');

        const entryWindow = this.calculateFibLevel(d, c, this.config.ewRate);
        const tpLevel = this.calculateFibLevel(d, c, this.config.tpRate);
        const slLevel = this.calculateFibLevel(d, c, this.config.slRate);

        // Buy signal conditions
        const buyCondition = bullishPatterns.length > 0 && currentCandle.close <= entryWindow;
        const buyCloseCondition = this.state.inBuyTrade && 
            (currentCandle.high >= this.state.buyTpLevel || currentCandle.low <= this.state.buySlLevel);

        // Sell signal conditions
        const sellCondition = bearishPatterns.length > 0 && currentCandle.close >= entryWindow;
        const sellCloseCondition = this.state.inSellTrade && 
            (currentCandle.low <= this.state.sellTpLevel || currentCandle.high >= this.state.sellSlLevel);

        // Generate buy signal
        if (buyCondition && !this.state.inBuyTrade) {
            signals.push({
                type: 'buy',
                price: currentCandle.close,
                tpLevel,
                slLevel,
                patterns: bullishPatterns,
                message: `Buy Signal - Patterns: ${bullishPatterns.map(p => p.name).join(', ')}`
            });
            
            this.state.inBuyTrade = true;
            this.state.buyTpLevel = tpLevel;
            this.state.buySlLevel = slLevel;
        }

        // Generate buy close signal
        if (buyCloseCondition) {
            signals.push({
                type: 'buy_close',
                price: currentCandle.close,
                message: 'Buy Close Signal'
            });
            
            this.state.inBuyTrade = false;
            this.state.buyTpLevel = null;
            this.state.buySlLevel = null;
        }

        // Generate sell signal
        if (sellCondition && !this.state.inSellTrade) {
            signals.push({
                type: 'sell',
                price: currentCandle.close,
                tpLevel,
                slLevel,
                patterns: bearishPatterns,
                message: `Sell Signal - Patterns: ${bearishPatterns.map(p => p.name).join(', ')}`
            });
            
            this.state.inSellTrade = true;
            this.state.sellTpLevel = tpLevel;
            this.state.sellSlLevel = slLevel;
        }

        // Generate sell close signal
        if (sellCloseCondition) {
            signals.push({
                type: 'sell_close',
                price: currentCandle.close,
                message: 'Sell Close Signal'
            });
            
            this.state.inSellTrade = false;
            this.state.sellTpLevel = null;
            this.state.sellSlLevel = null;
        }

        return signals;
    }

    // Format message for alerts
    formatMessage(template, currentPrice, symbol) {
        return template
            .replace('close', currentPrice.toString())
            .replace('symbol', symbol)
            + ` Price: ${currentPrice} Symbol: ${symbol}`;
    }

    // Reset strategy state
    reset() {
        this.state = {
            inBuyTrade: false,
            inSellTrade: false,
            buyBarIndex: null,
            sellBarIndex: null,
            buyTpLevel: null,
            buySlLevel: null,
            sellTpLevel: null,
            sellSlLevel: null,
            zigzagPoints: [],
            lastPatternPoints: { x: null, a: null, b: null, c: null, d: null }
        };
    }
}

// Usage example:
/*
const strategy = new HarmonicPatternStrategy({
    tradeSize: 10000,
    ewRate: 0.382,
    tpRate: 0.618,
    slRate: -0.618
});

// Example candle data structure:
const candles = [
    { open: 100, high: 105, low: 99, close: 103, time: 1640995200000 },
    { open: 103, high: 107, low: 102, close: 105, time: 1640995260000 },
    // ... more candles
];

const result = strategy.analyze(candles);
// console.log('Signals:', result.signals);
// console.log('Patterns:', result.patterns);
// console.log('Fibonacci Levels:', result.fibLevels);
*/

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HarmonicPatternStrategy;
}