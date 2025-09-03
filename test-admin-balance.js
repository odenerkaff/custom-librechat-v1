const axios = require('axios');

// Teste direto do painel admin
async function testAdminBalance() {
  console.log('🔍 TESTE DIRETO DO PAINEL ADMIN E BALANCE');
  console.log('='.repeat(60));

  try {
    const BASE_URL = 'http://localhost:3091';

    // Credenciais de admin (baseadas no script reset-admin-password.js)
    const loginData = {
      email: 'admin@example.com',
      password: 'password123'
    };

    console.log('\n🔐 1. Fazendo login...');
    console.log(`📧 Email: ${loginData.email}`);

    const login = await axios.post(`${BASE_URL}/api/auth/login`, loginData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (login.data.token) {
      console.log('✅ LOGIN SUCEDIDO!');
      const token = login.data.token;
      console.log(`🔑 Token: ${token.substring(0, 30)}...`);

      // Testar listagem de usuários
      console.log('\n👥 2. Listando usuários com balance...');
      const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Lista de usuários carregada!`);
      console.log(`👥 Total de usuários: ${usersResponse.data.length}`);

      console.log('\n📊 BALANCE ATUAL DOS USUÁRIOS:');
      console.log('-'.repeat(40));

      usersResponse.data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   📧 ${user.email}`);
        console.log(`   💰 Balance: ${user.balance || 0} créditos`);
        console.log('');
      });

      // Verificar se Dener tem 20000 créditos
      const denerUser = usersResponse.data.find(u => u.name === 'Dener Alves');
      if (denerUser) {
        console.log('🎯 VERIFICAÇÃO DO DENIS:');
        console.log(`👤 Usuario: ${denerUser.name}`);
        console.log(`💰 Balance atual: ${denerUser.balance} créditos`);

        if (denerUser.balance === 20000) {
          console.log('✅ CORRETO: Balance correto!');
        } else {
          console.log('❌ INCORRETO: Balance deveria ser 20000!');
        }
      } else {
        console.log('❌ Usuário Dener não encontrado');
      }

      return usersResponse.data;
    }

  } catch (error) {
    console.log('\n🔥 ERRO NO TESTE:');
    console.log('-'.repeat(30));

    if (error.response?.status === 404) {
      console.log('❌ 404: Rota não encontrada - servidor pode não estar rodando');
    } else if (error.response?.status === 401) {
      console.log('❌ 401: Credenciais inválidas');
      console.log('💡 Verificar se usuário admin existe');
    } else {
      console.log(`❌ ${error.response?.status || 'ERROR'}: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🔧 SOLUÇÕES:');
    console.log('1. npm run backend:dev');
    console.log('2. node reset-admin-password.js');
    console.log('3. node simple-user-check.js');
  }
}

testAdminBalance();
