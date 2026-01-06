/**
 * Test Production Webhook
 * Usage: node scripts/test-webhook-production.js
 */

const https = require('https');

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testProductionWebhook() {
  // console.log('🔍 Testing production webhook...\n');

  try {
    const testData = {
      OrderTrackingId: 'test_webhook_' + Date.now(),
      OrderNotificationType: 'IPNCHANGE',
      OrderMerchantReference: 'test_ref_' + Date.now()
    };

    // console.log('🔍 Test data:', JSON.stringify(testData, null, 2));

    const response = await makeRequest('https://readypips.com/api/payments/pesapal-webhook', testData);

    // console.log('🔍 Webhook response status:', response.status);
    // console.log('🔍 Webhook response data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      // console.log('\n✅ Webhook is working!');
    } else {
      // console.log('\n⚠️  Webhook responded with non-200 status');
    }

  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

// Run the test
testProductionWebhook();
