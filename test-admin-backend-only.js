// Teste direto da API admin sem passar pelo frontend
const https = require('https');
const http = require('http');

async function testAdminAPI() {
  const SERVER_PORT = 3080;
  const SERVER_HOST = 'localhost';

  // Primeiro, faça login para obter token válido
  console.log('🔐 Fazendo login par obter token...');

  const loginData = JSON.stringify({
    email: 'deneralves@kaffco.com.br',
    password: 'admin123456'
  });

  const loginOptions = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginToken = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          if (response.token) {
            console.log('✅ Login realizado com sucesso!');
            console.log('📝 Token obtido (primeiros 50 caracteres):', response.token.substring(0, 50) + '...');
            resolve(response.token);
          } else {
            reject(new Error('Token não encontrado na resposta'));
          }
        } else {
          reject(new Error(`Login falhou: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(loginData);
    req.end();
  }).catch((err) => {
    console.error('❌ Erro no login:', err.message);
    return null;
  });

  if (!loginToken) {
    console.log('🚫 Não foi possível obter token. Abortando teste.');
    return;
  }

  // Agora teste a API admin
  console.log('\n🔍 Testando API Admin com token...')
  const adminOptions = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/api/admin/users',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${loginToken}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(adminOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Status da resposta admin: ${res.statusCode}`);

        if (res.statusCode === 200) {
          try {
            const users = JSON.parse(data);
            console.log(`✅ API ADMIN FUNCIONANDO! Encontrados ${users.length} usuários:`);

            users.forEach((user, index) => {
              console.log(`  ${index + 1}. ${user.name || 'Sem nome'} (${user.email || 'Sem email'}) - Role: ${user.role}`);
            });

            console.log('\n🎉 TESTE COMPLETO: Backend admin está funcionando perfeitamente!');
            resolve(users);

          } catch (parseError) {
            console.error('❌ Erro ao analisar resposta JSON:', parseError.message);
            console.log('Raw response:', data);
            reject(parseError);
          }
        } else {
          console.log(`❌ API admin retornou erro ${res.statusCode}`);
          console.log('Erro message:', data);
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erro na requisição admin:', err.message);
      reject(err);
    });

    req.setTimeout(5000, () => {
      console.error('❌ Timeout na requisição admin');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Executar teste
console.log('🔬 INICIANDO TESTE DO BACKEND ADMIN');
console.log('=' .repeat(50));

testAdminAPI().then(() => {
  console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
  process.exit(0);
}).catch((err) => {
  console.log('\n❌ TESTE FALHOU:', err.message);
  process.exit(1);
});
