const fetch = require('node-fetch');

async function testSignalsAPI() {
    try {
        // console.log('Testing Signals API after fixes...');

        // Test the signals API
        // console.log('\n1. Testing /api/signals endpoint...');
        const signalsResponse = await fetch('http://localhost:3000/api/signals');

        if (signalsResponse.ok) {
            const signalsData = await signalsResponse.json();
            // console.log('Signals API Response Status:', signalsResponse.status);
            // console.log('Number of signals:', signalsData.length || 0);

            if (signalsData.length > 0) {
                // console.log('First signal sample:', JSON.stringify(signalsData[0], null, 2));
            }
        } else {
            // console.log('Signals API Error Status:', signalsResponse.status);
            const errorData = await signalsResponse.json();
            // console.log('Error:', errorData);
        }

        // Test signal generation
        // console.log('\n2. Testing signal generation...');
        const generateResponse = await fetch('http://localhost:3000/api/signals', {
            method: 'POST'
        });

        if (generateResponse.ok) {
            const generateData = await generateResponse.json();
            // console.log('Signal generation response:', generateData);
        } else {
            // console.log('Signal generation error:', generateResponse.status);
            const errorData = await generateResponse.json();
            // console.log('Error:', errorData);
        }

    } catch (error) {
        console.error('Error testing APIs:', error.message);
    }
}

testSignalsAPI(); 