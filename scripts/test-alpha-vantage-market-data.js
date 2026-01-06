const fetch = require('node-fetch');

// Test Alpha Vantage market data API
async function testAlphaVantageMarketData() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
        // console.log('❌ No ALPHA_VANTAGE_API_KEY found in environment variables');
        // console.log('💡 Please set your Alpha Vantage API key in .env.local');
        return;
    }

    // console.log('🔑 Alpha Vantage API Key found:', apiKey.substring(0, 8) + '...');

    // Test with Gold (XAUUSD)
    const symbol = 'XAUUSD';
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

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

        // Check for quote data
        if (data["Global Quote"]) {
            const quote = data["Global Quote"];
            // console.log(`✅ Success! Found quote data for ${symbol}`);
            // console.log('📈 Quote data:');
            // console.log('  Symbol:', quote["01. symbol"]);
            // console.log('  Price:', quote["05. price"]);
            // console.log('  Change:', quote["09. change"]);
            // console.log('  Change %:', quote["10. change percent"]);
            // console.log('  Volume:', quote["06. volume"]);
            // console.log('  High:', quote["03. high"]);
            // console.log('  Low:', quote["04. low"]);
            // console.log('  Open:', quote["02. open"]);
            // console.log('  Last Trading Day:', quote["07. latest trading day"]);
        } else {
            // console.log('⚠️ No quote data found in response');
            // console.log('📊 Full response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('❌ Error testing Alpha Vantage API:', error.message);
    }
}

// Test time series data
async function testAlphaVantageTimeSeries() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
        // console.log('❌ No ALPHA_VANTAGE_API_KEY found');
        return;
    }

    // console.log('\n🧪 Testing Alpha Vantage time series...');

    // Test with Gold daily data
    const symbol = 'XAUUSD';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data["Error Message"]) {
            // console.log('❌ TIME_SERIES_DAILY Error:', data["Error Message"]);
        } else if (data["Time Series (Daily)"]) {
            const timeSeries = data["Time Series (Daily)"];
            const dates = Object.keys(timeSeries);
            // console.log('✅ TIME_SERIES_DAILY working');
            // console.log(`📊 Found ${dates.length} days of data`);
            
            if (dates.length > 0) {
                const latestDate = dates[0];
                const latestData = timeSeries[latestDate];
                // console.log(`📈 Latest data (${latestDate}):`);
                // console.log('  Open:', latestData["1. open"]);
                // console.log('  High:', latestData["2. high"]);
                // console.log('  Low:', latestData["3. low"]);
                // console.log('  Close:', latestData["4. close"]);
                // console.log('  Volume:', latestData["5. volume"]);
            }
        } else {
            // console.log('⚠️ TIME_SERIES_DAILY unexpected response format');
        }
    } catch (error) {
        // console.log('❌ TIME_SERIES_DAILY error:', error.message);
    }
}

// Run tests
async function runTests() {
    // console.log('🚀 Testing Alpha Vantage Market Data Integration...\n');

    await testAlphaVantageMarketData();
    await testAlphaVantageTimeSeries();

    // console.log('\n✅ Alpha Vantage Market Data testing complete!');
}

runTests().catch(console.error);
