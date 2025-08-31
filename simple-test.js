// Teste simples da API
async function testBackendDirectly() {
  console.log('🔧 Teste direto do servidor backend...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3080/health');
    console.log('Health status:', healthResponse.status);

    if (healthResponse.ok) {
      console.log('✅ Server is running and responding!');
    }

    // Test 2: Login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginRequest = {
      email: 'deneralves@kaffco.com.br',
      password: 'admin123456'
    };

    console.log('Login payload:', JSON.stringify(loginRequest, null, 2));

    const loginResponse = await fetch('http://localhost:3080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginRequest)
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));

    const loginResult = await loginResponse.json();
    console.log('Login result:', JSON.stringify(loginResult, null, 2));

    if (loginResult.token) {
      console.log('\n3. Testing admin API with JWT...');
      const adminResponse = await fetch('http://localhost:3080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${loginResult.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Admin API status:', adminResponse.status);

      if (adminResponse.ok) {
        const users = await adminResponse.json();
        console.log('✅ SUCCESS! Users retrieved:');
        console.log('Total users:', users.length);
        if (users.length > 0) {
          users.forEach((user, i) => {
            console.log(`${i+1}. ${user.name} (${user.role}) - ${user.email}`);
          });
        }
      } else {
        const errorData = await adminResponse.text();
        console.log('❌ Admin API error:', errorData);
      }

    } else {
      console.log('❌ No token received from login');
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Testar conexão básica primeiro
fetch('http://localhost:3080/health')
  .then(response => {
    if (response.ok) {
      console.log('✅ Server is responding to basic requests');
      testBackendDirectly();
    } else {
      console.log('❌ Server returned error for basic request');
    }
  })
  .catch(error => {
    console.log('❌ Cannot connect to server:', error.message);
  });
