// Simple test to check if the signals API is working
// console.log('Testing Signals API...');

// This will be run in the browser console
async function testSignalsAPI() {
    try {
        // console.log('1. Testing /api/signals endpoint...');
        const response = await fetch('/api/signals');

        if (response.ok) {
            const data = await response.json();
            // console.log('✅ Signals API working!');
            // console.log('Number of signals:', data.length || 0);

            if (data.length > 0) {
                // console.log('First signal:', data[0]);
            }
        } else {
            // console.log('❌ Signals API error:', response.status);
            const error = await response.json();
            // console.log('Error details:', error);
        }

        // console.log('\n2. Testing signal generation...');
        const generateResponse = await fetch('/api/signals', {
            method: 'POST'
        });

        if (generateResponse.ok) {
            const result = await generateResponse.json();
            // console.log('✅ Signal generation working!');
            // console.log('Result:', result);
        } else {
            // console.log('❌ Signal generation error:', generateResponse.status);
            const error = await generateResponse.json();
            // console.log('Error details:', error);
        }

    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Instructions for running this test
// console.log('\nTo run this test:');
// console.log('1. Open your browser to http://localhost:3000');
// console.log('2. Open Developer Tools (F12)');
// console.log('3. Go to Console tab');
// console.log('4. Copy and paste the testSignalsAPI function above');
// console.log('5. Run: testSignalsAPI()'); 