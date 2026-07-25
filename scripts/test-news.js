const axios = require('axios');

async function testNewsAPI() {
    // console.log('🧪 Testing News API...');

    try {
        // Test 1: Get news from database
        // console.log('\n📰 Test 1: Getting news from database...');
        const response1 = await axios.get('http://localhost:3000/api/news');
        const news1 = response1.data;
        // console.log(`📰 Response status: ${response1.status}`);
        // console.log(`📰 News count: ${Array.isArray(news1) ? news1.length : 'Not an array'}`);
        if (Array.isArray(news1) && news1.length > 0) {
            // console.log('📰 First news item:', {
                title: news1[0].title,
                category: news1[0].category,
                sentiment: news1[0].sentiment,
                source: news1[0].source
            });
        }

        // Test 2: Force refresh to get fresh news
        // console.log('\n🔄 Test 2: Forcing fresh news fetch...');
        const response2 = await axios.get('http://localhost:3000/api/news?refresh=true');
        const news2 = response2.data;
        // console.log(`📰 Response status: ${response2.status}`);
        // console.log(`📰 Fresh news count: ${Array.isArray(news2) ? news2.length : 'Not an array'}`);
        if (Array.isArray(news2) && news2.length > 0) {
            // console.log('📰 First fresh news item:', {
                title: news2[0].title,
                category: news2[0].category,
                sentiment: news2[0].sentiment,
                source: news2[0].source
            });
        }

        // Test 3: Test category filtering
        // console.log('\n🏷️ Test 3: Testing category filtering...');
        const response3 = await axios.get('http://localhost:3000/api/news?category=CPI');
        const news3 = response3.data;
        // console.log(`📰 CPI news count: ${Array.isArray(news3) ? news3.length : 'Not an array'}`);

    } catch (error) {
        console.error('❌ Error testing news API:', error.response?.data || error.message);
    }
}

testNewsAPI(); 