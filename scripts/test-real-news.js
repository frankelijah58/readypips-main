// Test script for real-time news from Alpha Vantage
// console.log('🧪 Testing Real-Time News Integration...');

async function testRealNews() {
    try {
        // console.log('\n1. Testing /api/news endpoint with real Alpha Vantage data...');
        const response = await fetch('/api/news?refresh=true');

        if (response.ok) {
            const news = await response.json();
            // console.log(`✅ Successfully fetched ${news.length} news articles`);

            if (news.length > 0) {
                // console.log('\n📰 Sample News Article:');
                const sample = news[0];
                // console.log(`   Title: ${sample.title}`);
                // console.log(`   Source: ${sample.source}`);
                // console.log(`   Category: ${sample.category}`);
                // console.log(`   Impact: ${sample.impact}`);
                // console.log(`   Sentiment: ${sample.sentiment} (Score: ${sample.sentimentScore?.toFixed(2) || 'N/A'})`);
                // console.log(`   Symbols: ${sample.symbols.join(', ')}`);
                // console.log(`   Published: ${new Date(sample.publishedAt).toLocaleString()}`);
            }

            // Analyze sentiment distribution
            const sentimentCounts = {
                POSITIVE: news.filter(n => n.sentiment === 'POSITIVE').length,
                NEGATIVE: news.filter(n => n.sentiment === 'NEGATIVE').length,
                NEUTRAL: news.filter(n => n.sentiment === 'NEUTRAL').length
            };

            // console.log('\n📊 Sentiment Distribution:');
            // console.log(`   Positive: ${sentimentCounts.POSITIVE}`);
            // console.log(`   Negative: ${sentimentCounts.NEGATIVE}`);
            // console.log(`   Neutral: ${sentimentCounts.NEUTRAL}`);

            // Calculate average sentiment score
            const avgScore = news.reduce((sum, item) => sum + (item.sentimentScore || 0), 0) / news.length;
            // console.log(`   Average Sentiment Score: ${avgScore.toFixed(3)}`);

            // Category distribution
            const categoryCounts = {};
            news.forEach(item => {
                categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            });

            // console.log('\n📈 Category Distribution:');
            Object.entries(categoryCounts).forEach(([category, count]) => {
                // console.log(`   ${category}: ${count}`);
            });

        } else {
            // console.log(`❌ Error: ${response.status} ${response.statusText}`);
            const error = await response.text();
            // console.log(`   Details: ${error}`);
        }

        // console.log('\n2. Testing sentiment analysis with sample text...');
        const testTexts = [
            "CPI data shows inflation cooling, markets rally on positive outlook",
            "Fed raises interest rates, markets plunge on bearish sentiment",
            "GDP growth remains steady, economic indicators show mixed results"
        ];

        testTexts.forEach((text, index) => {
            // console.log(`   Test ${index + 1}: "${text}"`);
            // Note: This would test the sentiment analysis function if exposed
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testRealNews(); 