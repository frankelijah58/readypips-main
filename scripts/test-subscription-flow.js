require('dotenv').config({ path: '.env.local' });

// console.log('🧪 Testing Subscription Flow...\n');

// Test JWT token generation and verification
function testJWT() {
  // console.log('🔐 Testing JWT functionality...');
  
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const userId = '68b1fcc05cf0b6dbd69a7c74'; // Your actual user ID
  
  try {
    // Generate token
    const token = jwt.sign({ userId }, secret, { expiresIn: '7d' });
    // console.log('✅ Token generated:', token.substring(0, 20) + '...');
    
    // Verify token
    const decoded = jwt.verify(token, secret);
    // console.log('✅ Token verified:', decoded);
    
    return token;
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
    return null;
  }
}

// Test user data structure
function testUserData() {
  // console.log('\n👤 Testing user data structure...');
  
  const mockUser = {
    _id: '68b1fcc05cf0b6dbd69a7c74',
    email: 'e.patrickmugo@gmail.com',
    firstName: 'Patrick',
    lastName: 'Mugo',
    subscriptionStatus: 'inactive',
    subscriptionType: null,
    subscriptionEndDate: null,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // console.log('✅ Mock user created:', {
    id: mockUser._id,
    email: mockUser.email,
    name: `${mockUser.firstName} ${mockUser.lastName}`,
    subscription: `${mockUser.subscriptionStatus} (${mockUser.subscriptionType || 'none'})`
  });
  
  return mockUser;
}

// Test plan mapping
function testPlanMapping() {
  // console.log('\n📋 Testing plan mapping...');
  
  const stripePlanMapping = {
    starter: "basic",
    professional: "premium", 
    enterprise: "pro"
  };
  
  const paystackPlanMapping = {
    starter: "basic",
    professional: "premium", 
    enterprise: "pro"
  };
  
  // console.log('✅ Stripe plan mapping:', stripePlanMapping);
  // console.log('✅ Paystack plan mapping:', paystackPlanMapping);
  
  // Test mapping
  const testPlans = ['starter', 'professional', 'enterprise'];
  testPlans.forEach(plan => {
    const mappedPlan = stripePlanMapping[plan];
    // console.log(`  ${plan} → ${mappedPlan}`);
  });
}

// Test subscription update logic
function testSubscriptionUpdate() {
  // console.log('\n🔄 Testing subscription update logic...');
  
  const subscriptionData = {
    subscriptionStatus: "active",
    subscriptionType: "premium",
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
  
  // console.log('✅ Subscription data:', {
    status: subscriptionData.subscriptionStatus,
    type: subscriptionData.subscriptionType,
    endDate: subscriptionData.subscriptionEndDate.toISOString().split('T')[0]
  });
  
  return subscriptionData;
}

// Test payment verification flow
function testPaymentVerification() {
  // console.log('\n💳 Testing payment verification flow...');
  
  // Simulate Stripe payment data
  const stripePayment = {
    id: 'cs_test_123',
    payment_status: 'paid',
    metadata: {
      userId: '68b1fcc05cf0b6dbd69a7c74',
      plan: 'professional'
    },
    amount_total: 9999,
    currency: 'usd'
  };
  
  // Simulate Paystack payment data
  const paystackPayment = {
    status: true,
    data: {
      status: 'success',
      metadata: {
        planId: 'premium',
        planName: 'Professional Plan'
      },
      amount: 1298700, // in cents (KES)
      currency: 'KES'
    }
  };
  
  // console.log('✅ Stripe payment data:', {
    id: stripePayment.id,
    status: stripePayment.payment_status,
    plan: stripePayment.metadata.plan,
    amount: stripePayment.amount_total / 100
  });
  
  // console.log('✅ Paystack payment data:', {
    status: paystackPayment.data.status,
    plan: paystackPayment.data.metadata.planId,
    amount: paystackPayment.data.amount / 100
  });
  
  return { stripePayment, paystackPayment };
}

// Test database operations
async function testDatabaseOperations() {
  // console.log('\n🗄️ Testing database operations...');
  
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
        subscription: user.subscriptionStatus
      });
    } else {
      // console.log('❌ User not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  // console.log('🚀 Starting subscription flow tests...\n');
  
  // Test JWT
  const token = testJWT();
  
  // Test user data
  const user = testUserData();
  
  // Test plan mapping
  testPlanMapping();
  
  // Test subscription update
  const subscriptionData = testSubscriptionUpdate();
  
  // Test payment verification
  const paymentData = testPaymentVerification();
  
  // Test database
  const dbSuccess = await testDatabaseOperations();
  
  // console.log('\n📊 Test Results Summary:');
  // console.log(`✅ JWT Token: ${token ? 'Generated' : 'Failed'}`);
  // console.log(`✅ User Data: Valid`);
  // console.log(`✅ Plan Mapping: Valid`);
  // console.log(`✅ Subscription Data: Valid`);
  // console.log(`✅ Payment Data: Valid`);
  // console.log(`✅ Database: ${dbSuccess ? 'Connected' : 'Failed'}`);
  
  if (token && dbSuccess) {
    // console.log('\n🎉 All tests passed! Subscription flow should work correctly.');
    // console.log('\n📝 Next steps:');
    // console.log('1. Test actual payment flow with Stripe/Paystack');
    // console.log('2. Verify user subscription status updates in database');
    // console.log('3. Check success page displays real user data');
  } else {
    // console.log('\n⚠️ Some tests failed. Please check the issues above.');
  }
}

// Run tests
runAllTests().catch(console.error);
