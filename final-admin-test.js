const axios = require('axios');

// FINAL TEST to identify Admin API issues
async function finalAdminTest() {
const SERVER_URL = 'http://localhost:3081';

  console.log('🔍 FINAL ADMIN API DIAGNOSTIC TEST\n');
  console.log('=' .repeat(50));

  try {
    // STEP 1: Test basic connectivity
    console.log('\n1. 🏥 HEALTH CHECK');
    const health = await axios.get(`${SERVER_URL}/health`);
    console.log('✅ Server Response:', health.status);

    // STEP 2: LOGIN to get JWT token
    console.log('\n2. 🔐 LOGIN TEST');
    console.log('Attempting login with: deneralves@kaffco.com.br');

    const loginPayload = {
      email: 'deneralves@kaffco.com.br',
      password: 'admin123456'
    };

    console.log('Payload:', loginPayload);

    const login = await axios.post(`${SERVER_URL}/api/auth/login`, loginPayload);
    console.log('✅ Login Successful!');
    console.log('Status:', login.status);
    console.log('Token Length:', login.data.token.length, 'characters');

    // Extract token for admin calls
    const jwtToken = login.data.token;
    console.log('\nToken Preview:', jwtToken.substring(0, 20) + '...');

    // STEP 3: Test ADMIN API with proper JWT
    console.log('\n3. 👑 ADMIN API TEST');
    console.log('Testing endpoint:', `${SERVER_URL}/api/admin/users`);
    console.log('Using JWT token:', jwtToken ? 'YES' : 'NO');

    const adminResponse = await axios.get(`${SERVER_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ SUCCESS! Admin API working!');
    console.log('Status:', adminResponse.status);
    console.log('Users Found:', adminResponse.data.length);

    if (adminResponse.data.length > 0) {
      console.log('\n👥 USER DATA PREVIEW:');
      adminResponse.data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.email}`);
      });
    }

    // STEP 4: Test without JWT for comparison
    console.log('\n4. 🚫 TESTING WITHOUT AUTH (should fail)');
    try {
      await axios.get(`${SERVER_URL}/api/admin/users`);
    } catch (noAuthError) {
      console.log('✅ Correctly rejected - Status:', noAuthError.response?.status);
      console.log('Error message:', noAuthError.response?.data?.message);
    }

  } catch (error) {
    console.log('\n❌ ERROR OCCURRED:');
    console.log('Error Type:', error.code || error.name);
    console.log('Message:', error.message);

    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    }

    console.log('\n🔍 POSSIBLE CAUSES:');
    console.log('1. Server not started (port 3080)');
    console.log('2. Database connection issues');
    console.log('3. Authentication middleware problems');
    console.log('4. JWT token format issues');
    console.log('5. MongoDB query issues');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔍 DIAGNOSTIC COMPLETE');
  console.log('Check server logs for detailed [ADMIN API DEBUG] messages');
}

finalAdminTest();
