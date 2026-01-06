require('dotenv').config({ path: '.env.local' });

// console.log('🔍 Checking environment variables...\n');

// Check JWT secret
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  if (jwtSecret === 'your-secret-key' || jwtSecret === 'your-super-secret-jwt-key-here') {
    // console.log('⚠️  JWT_SECRET is using default value - this is not secure!');
  } else if (jwtSecret.length < 32) {
    // console.log('⚠️  JWT_SECRET is too short - should be at least 32 characters');
  } else {
    // console.log('✅ JWT_SECRET is properly configured');
  }
  // console.log(`   Length: ${jwtSecret.length} characters`);
  // console.log(`   Preview: ${jwtSecret.substring(0, 10)}...`);
} else {
  // console.log('❌ JWT_SECRET is not set');
}

// Check MongoDB URI
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  // console.log('✅ MONGODB_URI is set');
  // console.log(`   Preview: ${mongoUri.substring(0, 20)}...`);
} else {
  // console.log('❌ MONGODB_URI is not set');
}

// Check Stripe keys
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (stripeSecret) {
  // console.log('✅ STRIPE_SECRET_KEY is set');
  // console.log(`   Preview: ${stripeSecret.substring(0, 10)}...`);
} else {
  // console.log('❌ STRIPE_SECRET_KEY is not set');
}

// Check Paystack keys
const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
if (paystackSecret) {
  // console.log('✅ PAYSTACK_SECRET_KEY is set');
  // console.log(`   Preview: ${paystackSecret.substring(0, 10)}...`);
} else {
  // console.log('❌ PAYSTACK_SECRET_KEY is not set');
}

// console.log('\n🌐 Environment:');
// console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
// console.log(`Current working directory: ${process.cwd()}`);

// Check if .env.local exists
const fs = require('fs');
const envLocalPath = '.env.local';
if (fs.existsSync(envLocalPath)) {
  // console.log('✅ .env.local file exists');
  const stats = fs.statSync(envLocalPath);
  // console.log(`   Size: ${stats.size} bytes`);
  // console.log(`   Modified: ${stats.mtime}`);
} else {
  // console.log('❌ .env.local file does not exist');
  // console.log('   Please create it based on env.example');
}

// console.log('\n📝 Recommendations:');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
  // console.log('1. Set a strong JWT_SECRET in .env.local');
  // console.log('2. Use a random string of at least 32 characters');
  // console.log('3. Example: JWT_SECRET=your-super-secure-random-string-here-12345');
}

if (!process.env.MONGODB_URI) {
  // console.log('1. Set MONGODB_URI in .env.local');
  // console.log('2. Format: mongodb://username:password@host:port/database');
}

// console.log('\n✅ Environment check completed!');
