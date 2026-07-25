/**
 * Mock Pesapal IPN Response
 * This simulates a webhook call from Pesapal for testing
 * Usage: node scripts/mock-pesapal-ipn.js <order_tracking_id>
 */

const https = require('https');
const http = require('http');

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
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

async function mockPesapalIPN(orderTrackingId) {
  // console.log(`🔍 Mocking Pesapal IPN for transaction: ${orderTrackingId}\n`);

  try {
    // console.log('🔍 Sending mock IPN to your webhook endpoint...');
    
    const mockIPNData = {
      OrderNotificationType: "IPNCHANGE",
      OrderTrackingId: orderTrackingId,
      OrderMerchantReference: `ref_${Date.now()}_mock`
    };

    // console.log('🔍 Mock IPN data:', JSON.stringify(mockIPNData, null, 2));

    const response = await makeRequest('http://localhost:3000/api/payments/pesapal-webhook', mockIPNData);

    // console.log('🔍 Webhook response status:', response.status);
    // console.log('🔍 Webhook response data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      // console.log('\n✅ Mock IPN sent successfully!');
      // console.log('🎉 Your webhook endpoint processed the notification');
    } else {
      // console.log('\n⚠️  Webhook responded with non-200 status');
    }

  } catch (error) {
    console.error('❌ Mock IPN failed:', error.message);
    // console.log('\n💡 Make sure your app is running on localhost:3000');
  }
}

// Get order tracking ID from command line argument
const orderTrackingId = process.argv[2];

if (!orderTrackingId) {
  // console.log('Usage: node scripts/mock-pesapal-ipn.js <order_tracking_id>');
  // console.log('Example: node scripts/mock-pesapal-ipn.js 9b5f77db-4ec2-4a8d-ba7d-db59dc9d9495');
  process.exit(1);
}

// Run the mock IPN
mockPesapalIPN(orderTrackingId);
