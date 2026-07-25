const { SignalService } = require('../lib/signal-service.ts');

async function testSignalGeneration() {
    // console.log('Testing real signal generation service...');

    try {
        const signalService = SignalService.getInstance();

        // Test market data fetching
        // console.log('Testing market data fetching...');
        const marketData = await signalService.getMarketData('BTC-USD', '1d', 100);
        // console.log(`Fetched ${marketData.length} data points for BTC-USD`);

        if (marketData.length > 0) {
            // console.log('Sample data point:', marketData[0]);
        }

        // Test technical indicators calculation
        if (marketData.length >= 50) {
            // console.log('Testing technical indicators calculation...');
            const indicators = signalService.calculateTechnicalIndicators(marketData);
            // console.log('Calculated indicators:', {
                rsi: indicators.rsi,
                macd: indicators.macd,
                sma20: indicators.sma20,
                sma50: indicators.sma50,
                bb: indicators.bb,
            });

            // Test signal analysis
            // console.log('Testing signal analysis...');
            const analysis = signalService.analyzeSignal('BTC-USD', marketData, indicators);
            // console.log('Signal analysis:', {
                signal: analysis.signal,
                confidence: analysis.confidence,
                price: analysis.price,
                target: analysis.target,
                stopLoss: analysis.stopLoss,
                reasoning: analysis.reasoning,
            });
        }

        // Test full signal generation
        // console.log('Testing full signal generation...');
        const signals = await signalService.generateSignals();
        // console.log(`Generated ${signals.length} signals`);

        if (signals.length > 0) {
            // console.log('Sample signal:', {
                symbol: signals[0].symbol,
                signal: signals[0].signal,
                confidence: signals[0].confidence,
                price: signals[0].price,
                reasoning: signals[0].reasoning,
            });
        }

    } catch (error) {
        console.error('Error testing signal generation:', error);
    }
}

// Run the test
testSignalGeneration(); 