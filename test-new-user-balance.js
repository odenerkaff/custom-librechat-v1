const axios = require('axios');

// Teste de criação de novo usuário com balance automático
async function testNewUserBalance() {
  console.log('➕ TESTE: CRIAR NOVO USUÁRIO COM BALANCE AUTOMÁTICO');
  console.log('='.repeat(60));

  try {
    const BASE_URL = 'http://localhost:3091';

    // Credenciais de admin
    const loginData = {
      email: 'admin@example.com',
      password: 'password123'
    };

    console.log('\n🔐 1. Fazendo login como admin...');
    const login = await axios.post(`${BASE_URL}/api/auth/login`, loginData, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (login.data.token) {
      console.log('✅ LOGIN SUCEDIDO!');
      const token = login.data.token;

      // Dados do novo usuário a ser criado
      const newUserData = {
        name: 'Teste Balance',
        email: `teste_${Date.now()}@test.com`,
        password: 'teste123456',
        role: 'USER'
      };

      console.log('\n👤 2. Criando novo usuário...');
      console.log(`📝 Nome: ${newUserData.name}`);
      console.log(`📧 Email: ${newUserData.email}`);
      console.log(`🔑 Senha: ${newUserData.password}`);
      console.log(`🏆 Role: ${newUserData.role}`);

      const createUserResponse = await axios.post(`${BASE_URL}/api/admin/users`, newUserData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ NOVO USUÁRIO CRIADO COM SUCESSO!');

      const createdUser = createUserResponse.data;
      console.log('📊 DADOS DO USUÁRIO CRIADO:');
      console.log(`👤 Nome: ${createdUser.name}`);
      console.log(`📧 Email: ${createdUser.email}`);
      console.log(`🏆 Role: ${createdUser.role}`);
      console.log(`💰 Balance inicial: ${createdUser.balance || 'Não informado'}`);
      console.log(`🆔 ID: ${createdUser.id}`);

      // Listar usuários para verificar o balance na listagem
      console.log('\n👥 3. Verificando balance na listagem de usuários...');
      const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`👥 Total usuários encontrados: ${usersResponse.data.length}`);

      // Buscar o usuário recém-criado
      const newlyCreatedUser = usersResponse.data.find(u => u.email === newUserData.email);

      if (newlyCreatedUser) {
        console.log('📊 VERIFICAÇÃO FINAL:');
        console.log(`👤 Usuario: ${newlyCreatedUser.name}`);
        console.log(`📧 Email: ${newlyCreatedUser.email}`);
        console.log(`💰 Balance na listagem: ${newlyCreatedUser.balance} créditos`);

        if (newlyCreatedUser.balance === 20000) {
          console.log('🎉 SUCESSO TOTAL!');
          console.log('✅ Novo usuário criado');
          console.log('✅ Balance inicial atribuído (20,000 créditos)');
          console.log('✅ Balance aparecendo na listagem');
          console.log('✅ Painel admin funcionando 100%');
          console.log('');
          console.log('🚀 RESULTADO: SISTEMA FUNCIONANDO PERFEITAMENTE!');
        } else {
          console.log('❌ Balance incorreto');
          console.log(`💡 Expected: 20000, Got: ${newlyCreatedUser.balance}`);
        }
      } else {
        console.log('❌ Usuário recém-criado não encontrado na listagem');
      }

      return createdUser;

    } else {
      console.log('❌ LOGIN FALHOU!');
      return null;
    }

  } catch (error) {
    console.log('\n🔥 ERRO NO TESTE:');
    console.log('-'.repeat(30));

    if (error.response) {
      const { status, data } = error.response;
      console.log(`❌ HTTP ${status}: ${data.message || error.message}`);

      if (status === 404) {
        console.log('💡 Servidor pode não estar rodando');
      } else if (status === 401) {
        console.log('💡 Credenciais inválidas');
      }
    } else {
      console.log(`❌ ${error.code}: ${error.message}`);
    }

    return null;
  }
}

testNewUserBalance();
