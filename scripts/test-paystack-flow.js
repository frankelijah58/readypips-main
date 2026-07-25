require('dotenv').config({ path: '.env.local' });

// console.log('🧪 Testing Paystack Payment Flow...\n');

// Test environment variables
function testEnvironment() {
  // console.log('🔍 Testing environment variables...');
  
  const requiredVars = [
    'PAYSTACK_SECRET_KEY',
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  let allGood = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      // console.log(`❌ ${varName}: NOT SET`);
      allGood = false;
    }
  });
  
  return allGood;
}

// Test database connection
async function testDatabase() {
  // console.log('\n🗄️ Testing database connection...');
  
  try {
    const { getDatabase } = require('../lib/mongodb');
    const db = await getDatabase();
    
    // console.log('✅ Database connected successfully');
    
    // Test user collection access
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    // console.log(`✅ Users collection accessible, count: ${userCount}`);
    
    // Test finding specific user
    const { ObjectId } = require('mongodb');
    const userId = new ObjectId('68b1fcc05cf0b6dbd69a7c74');
    const user = await usersCollection.findOne({ _id: userId });
    
    if (user) {
      // console.log('✅ User found:', {
        id: user._id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        subscription: user.subscriptionStatus,
        subscriptionType: user.subscriptionType
      });
      
      // Test subscription update
      // console.log('\n🔄 Testing subscription update...');
      const { updateUserSubscription } = require('../lib/auth');
      
      const testSubscriptionData = {
        subscriptionStatus: "active",
        subscriptionType: "premium",
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      
      await updateUserSubscription(userId.toString(), testSubscriptionData);
      // console.log('✅ Subscription update successful');
      
      // Verify the update
      const updatedUser = await usersCollection.findOne({ _id: userId });
      // console.log('✅ User updated:', {
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionType: updatedUser.subscriptionType,
        subscriptionEndDate: updatedUser.subscriptionEndDate
      });
      
      // Revert the test change
      await updateUserSubscription(userId.toString(), {
        subscriptionStatus: "inactive",
        subscriptionType: null,
        subscriptionEndDate: null
      });
      // console.log('✅ Test subscription reverted');
      
    } else {
      // console.log('❌ User not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

// Test Paystack API functions
async function testPaystackFunctions() {
  // console.log('\n💳 Testing Paystack functions...');
  
  try {
    const { verifyPaystackTransaction, validatePaystackWebhook } = require('../lib/payments');
    
    // console.log('✅ Paystack functions imported successfully');
    
    // Test webhook validation (with mock data)
    const mockPayload = {
      event: 'charge.success',
      data: {
        reference: 'test_ref_123',
        status: 'success'
      }
    };
    
    const mockSignature = 'mock_signature';
    const isValid = validatePaystackWebhook(mockPayload, mockSignature);
    // console.log(`✅ Webhook validation function working (result: ${isValid})`);
    
    return true;
  } catch (error) {
    console.error('❌ Paystack functions test failed:', error.message);
    return false;
  }
}

// Test URL construction
function testURLConstruction() {
  // console.log('\n🌐 Testing URL construction...');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/subscription/success`;
  const redirectUrl = `${baseUrl}/signals/success?reference=test_ref_123`;
  
  // console.log('✅ Base URL:', baseUrl);
  // console.log('✅ Success URL:', successUrl);
  // console.log('✅ Redirect URL:', redirectUrl);
  
  return true;
}

// Run all tests
async function runAllTests() {
  // console.log('🚀 Starting Paystack flow tests...\n');
  
  // Test environment
  const envGood = testEnvironment();
  
  // Test database
  const dbGood = await testDatabase();
  
  // Test Paystack functions
  const paystackGood = testPaystackFunctions();
  
  // Test URL construction
  const urlGood = testURLConstruction();
  
  // console.log('\n📊 Test Results Summary:');
  // console.log(`✅ Environment: ${envGood ? 'Good' : 'Failed'}`);
  // console.log(`✅ Database: ${dbGood ? 'Good' : 'Failed'}`);
  // console.log(`✅ Paystack Functions: ${paystackGood ? 'Good' : 'Failed'}`);
  // console.log(`✅ URL Construction: ${urlGood ? 'Good' : 'Failed'}`);
  
  if (envGood && dbGood && paystackGood && urlGood) {
    // console.log('\n🎉 All tests passed! Paystack flow should work correctly.');
    // console.log('\n📝 Flow summary:');
    // console.log('1. User selects plan → Paystack payment created');
    // console.log('2. Payment completed → Redirects to /subscription/success');
    // console.log('3. /subscription/success → Redirects to /signals/success?reference=xxx');
    // console.log('4. /signals/success → Verifies payment and updates user subscription');
    // console.log('5. User subscription status updated in database');
  } else {
    // console.log('\n⚠️ Some tests failed. Please check the issues above.');
  }
}

// Run tests
runAllTests().catch(console.error);
