const fetch = require('node-fetch');

// Test Alpha Vantage NEWS_SENTIMENT API
async function testAlphaVantageNews() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
        // console.log('❌ No ALPHA_VANTAGE_API_KEY found in environment variables');
        // console.log('💡 Please set your Alpha Vantage API key in .env.local');
        return;
    }

    // console.log('🔑 Alpha Vantage API Key found:', apiKey.substring(0, 8) + '...');

    // Test with proper NEWS_SENTIMENT endpoint
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL,GOOGL,MSFT&topics=technology,financial_markets&limit=10&apikey=${apiKey}`;

    // console.log('🔗 Testing URL:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // console.log('📊 Response status:', response.status);
        // console.log('📊 Response keys:', Object.keys(data));

        // Check for API errors
        if (data["Error Message"]) {
            console.error('❌ Alpha Vantage API Error:', data["Error Message"]);
            return;
        }

        if (data["Note"]) {
            console.warn('⚠️ Alpha Vantage API Note:', data["Note"]);
            return;
        }

        // Check for feed data
        if (data.feed && Array.isArray(data.feed)) {
            // console.log(`✅ Success! Found ${data.feed.length} articles`);

            if (data.feed.length > 0) {
                const firstArticle = data.feed[0];
                // console.log('📰 First article sample:');
                // console.log('  Title:', firstArticle.title);
                // console.log('  Source:', firstArticle.source);
                // console.log('  Time Published:', firstArticle.time_published);
                // console.log('  URL:', firstArticle.url);
                // console.log('  Summary length:', firstArticle.summary?.length || 0);

                // Check for sentiment data
                if (firstArticle.overall_sentiment_label) {
                    // console.log('  Sentiment:', firstArticle.overall_sentiment_label);
                    // console.log('  Sentiment Score:', firstArticle.overall_sentiment_score);
                }

                // Check for ticker sentiment
                if (firstArticle.ticker_sentiment) {
                    // console.log('  Ticker Sentiment:', firstArticle.ticker_sentiment);
                }
            }
        } else {
            // console.log('⚠️ No feed data found in response');
            // console.log('📊 Full response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error testing Alpha Vantage API:', error.message);
    }
}

// Test other Alpha Vantage endpoints
async function testAlphaVantageEndpoints() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
        // console.log('❌ No ALPHA_VANTAGE_API_KEY found');
        return;
    }

    // console.log('\n🧪 Testing other Alpha Vantage endpoints...');

    // Test TOP_GAINERS_LOSERS
    try {
        const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data["Error Message"]) {
            // console.log('❌ TOP_GAINERS_LOSERS Error:', data["Error Message"]);
        } else if (data.top_gainers || data.top_losers) {
            // console.log('✅ TOP_GAINERS_LOSERS working');
        } else {
            // console.log('⚠️ TOP_GAINERS_LOSERS unexpected response format');
        }
    } catch (error) {
        // console.log('❌ TOP_GAINERS_LOSERS error:', error.message);
    }

    // Test EARNINGS_CALL_TRANSCRIPT
    try {
        const url = `https://www.alphavantage.co/query?function=EARNINGS_CALL_TRANSCRIPT&symbol=AAPL&quarter=2024Q1&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data["Error Message"]) {
            // console.log('❌ EARNINGS_CALL_TRANSCRIPT Error:', data["Error Message"]);
        } else if (data.symbol || data.quarter) {
            // console.log('✅ EARNINGS_CALL_TRANSCRIPT working');
        } else {
            // console.log('⚠️ EARNINGS_CALL_TRANSCRIPT unexpected response format');
        }
    } catch (error) {
        // console.log('❌ EARNINGS_CALL_TRANSCRIPT error:', error.message);
    }
}

// Run tests
async function runTests() {
    // console.log('🚀 Testing Alpha Vantage API Integration...\n');

    await testAlphaVantageNews();
    await testAlphaVantageEndpoints();

    // console.log('\n✅ Alpha Vantage API testing complete!');
}

runTests().catch(console.error); 