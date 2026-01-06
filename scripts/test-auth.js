const fs = require('fs');
const path = require('path');

// console.log('🔍 Testing Authentication State...\n');

// Check if .env.local exists and has required variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    // console.log('✅ .env.local file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const requiredVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'STRIPE_SECRET_KEY',
        'PAYSTACK_SECRET_KEY',
        'ALPHA_VANTAGE_API_KEY'
    ];

    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            // console.log(`✅ ${varName} is configured`);
        } else {
            // console.log(`❌ ${varName} is missing`);
        }
    });
} else {
    // console.log('❌ .env.local file not found');
}

// console.log('\n📋 Authentication Flow Test:');
// console.log('1. Open browser and go to http://localhost:3000');
// console.log('2. Check browser console for auth logs');
// console.log('3. Check if token exists in localStorage');
// console.log('4. Try accessing /dashboard directly');
// console.log('5. Check if redirect loop occurs');

// console.log('\n🔧 To test localStorage token:');
// console.log('1. Open browser dev tools (F12)');
// console.log('2. Go to Application/Storage tab');
// console.log('3. Check Local Storage for "token"');
// console.log('4. If token exists, copy it and test with:');
// console.log('   curl -X POST http://localhost:3000/api/auth/verify \\');
// console.log('     -H "Content-Type: application/json" \\');
// console.log('     -d \'{"token":"YOUR_TOKEN_HERE"}\'');

// console.log('\n🚨 Common Issues:');
// console.log('- Invalid JWT_SECRET in .env.local');
// console.log('- Expired token in localStorage');
// console.log('- MongoDB connection issues');
// console.log('- Missing user in database'); 