// Script para criar 20 usuários aleatórios
// Execute com: node create-users-terminal.js
// Certifique-se de que o backend está rodando

const https = require('https');

async function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function createRandomUsers() {
  try {
    console.log('🚀 Iniciando criação de 20 usuários aleatórios...');
    console.log('💡 Certifique-se de que o backend está rodando em http://localhost:3080');
    console.log('💡 E que você tem um token de admin válido\n');

    // Você precisa fornecer o token JWT de admin aqui
    // Para obter o token, faça login como admin e copie do localStorage/cookies
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'SEU_TOKEN_AQUI';

    if (ADMIN_TOKEN === 'SEU_TOKEN_AQUI') {
      console.log('❌ ERRO: Você precisa configurar o token de admin!');
      console.log('📝 Como obter o token:');
      console.log('   1. Faça login como admin no navegador');
      console.log('   2. Abra o console (F12)');
      console.log('   3. Execute: localStorage.getItem("token")');
      console.log('   4. Copie o token e defina como variável de ambiente:');
      console.log('      set ADMIN_TOKEN="seu_token_aqui"  # Windows');
      console.log('      export ADMIN_TOKEN="seu_token_aqui"  # Linux/Mac');
      console.log('   5. Execute novamente: node create-users-terminal.js');
      process.exit(1);
    }

    const url = 'http://localhost:3080/api/admin/users/random';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    };

    const data = JSON.stringify({ count: 20 });

    const response = await makeRequest(url, options, data);

    if (response.status === 200 && response.data.success) {
      console.log('✅ SUCESSO! Usuários criados:');
      console.log(`📊 Total criados: ${response.data.created}`);
      console.log(`❌ Total com falha: ${response.data.failed}`);

      console.log('\n👥 Lista de usuários criados:');
      response.data.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.email} (Senha: ${user.password})`);
      });

      if (response.data.failures) {
        console.log('\n❌ Usuários que falharam:');
        response.data.failures.forEach((failure, index) => {
          console.log(`${index + 1}. ${failure.name} - ${failure.email}: ${failure.error}`);
        });
      }

      console.log('\n💡 Agora você pode fazer login com qualquer um desses usuários!');
      console.log('🔄 Atualize o painel admin para ver os novos usuários.');

    } else {
      console.error('❌ ERRO:', response.data.message || 'Erro desconhecido');
      if (response.data.error) {
        console.error('Detalhes:', response.data.error);
      }
    }

  } catch (error) {
    console.error('❌ ERRO na requisição:', error.message);
    console.log('💡 Possíveis soluções:');
    console.log('   - Certifique-se de que o backend está rodando: npm run backend');
    console.log('   - Verifique se o token de admin é válido');
    console.log('   - Verifique se a URL está correta: http://localhost:3080');
  }
}

createRandomUsers();
