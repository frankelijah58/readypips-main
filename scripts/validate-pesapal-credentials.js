// Validate Pesapal credentials
// Run with: node scripts/validate-pesapal-credentials.js

const fetch = require('node-fetch');

async function validatePesapalCredentials() {
  // console.log('🔍 Validating Pesapal Credentials...\n');

  // Check environment variables
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    // console.log('❌ Missing credentials in environment variables');
    // console.log('   PESAPAL_CONSUMER_KEY:', consumerKey ? 'Set' : 'Missing');
    // console.log('   PESAPAL_CONSUMER_SECRET:', consumerSecret ? 'Set' : 'Missing');
    // console.log('\n💡 Please set these in your .env.local file');
    return;
  }

  // console.log('✅ Environment variables found');
  // console.log(`   Consumer Key: ${consumerKey.substring(0, 8)}...`);
  // console.log(`   Consumer Secret: ${consumerSecret.substring(0, 8)}...\n`);

  // Validate credential format
  // console.log('🔍 Validating credential format...');
  
  if (consumerKey.length < 10) {
    // console.log('❌ Consumer Key seems too short (should be longer)');
  } else {
    // console.log('✅ Consumer Key length looks good');
  }

  if (consumerSecret.length < 20) {
    // console.log('❌ Consumer Secret seems too short (should be longer)');
  } else {
    // console.log('✅ Consumer Secret length looks good');
  }

  // Test with Pesapal API
  // console.log('\n🧪 Testing with Pesapal API...');
  
  try {
    const response = await fetch('https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
    });

    // console.log(`   Status: ${response.status}`);
    // console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    const data = await response.json();
    // console.log('   Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.token) {
      // console.log('\n✅ SUCCESS! Credentials are valid');
      // console.log(`   Token: ${data.token.substring(0, 20)}...`);
      // console.log(`   Expires: ${data.expiryDate}`);
      // console.log(`   Status: ${data.status}`);
    } else if (data.error) {
      // console.log('\n❌ FAILED! Credential validation failed');
      // console.log(`   Error Code: ${data.error.code}`);
      // console.log(`   Error Message: ${data.error.message}`);
      
      if (data.error.code === 'invalid_consumer_key_or_secret_provided') {
        // console.log('\n💡 Solutions:');
        // console.log('   1. Check if you\'re using sandbox credentials');
        // console.log('   2. Verify the credentials are copied correctly');
        // console.log('   3. Make sure there are no extra spaces');
        // console.log('   4. Get new credentials from Pesapal developer portal');
      }
    } else {
      // console.log('\n❌ FAILED! Unexpected response format');
    }

  } catch (error) {
    // console.log('\n❌ FAILED! Network or API error');
    // console.log(`   Error: ${error.message}`);
  }

  // console.log('\n📋 Next Steps:');
  // console.log('   1. If credentials are valid, run: node scripts/init-pesapal-test.js');
  // console.log('   2. If credentials are invalid, check PESAPAL_CREDENTIALS_GUIDE.md');
  // console.log('   3. Get new credentials from: https://developer.pesapal.com/');
}

// Run validation
validatePesapalCredentials().catch(console.error);
