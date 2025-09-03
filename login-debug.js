require('dotenv').config();
const axios = require('axios');

// URL da API do LibreChat
const BASE_URL = 'http://localhost:3090';

async function debugLogin() {
  console.log('🔐 DEBUG LOGIN - LibreChat');
  console.log('='.repeat(40));

  // Credenciais do usuário admin
  const credentials = {
    email: 'deneralves@kaffco.com.br',
    password: 'admin123456'
  };

  console.log('📧 Email:', credentials.email);
  console.log('🔑 Senha: admin123456\n');

  try {
    // Tentativa de login
    console.log('🚀 Fazendo tentativa de login...');

    const response = await axios.post(`${BASE_URL}/api/auth/login`, credentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.status === 200 && response.data.token) {
      console.log('✅ LOGIN BEM-SUCEDIDO!');
      console.log('🔑 Token gerado:', response.data.token.substring(0, 30) + '...');
      console.log('👤 Usuário:', response.data.user.name);
      console.log('🏆 Role:', response.data.user.role);

      // Testar painel admin
      console.log('\n🏛️ Testando acesso ao painel admin...');

      const adminResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (adminResponse.status === 200) {
        console.log('✅ PAINEL ADMIN FUNCIONANDO!');
        console.log('📊 Usuários no sistema:', adminResponse.data.length);
        console.log('🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
      } else {
        console.log('❌ Erro no painel admin:', adminResponse.status);
      }

    } else {
      console.log('❌ Login falhou - resposta inválida');
      console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.log('❌ ERRO NO LOGIN:');
    console.log('💡 Status:', error.response?.status);
    console.log('💡 Mensagem:', error.response?.data?.message || error.message);

    if (error.response?.status === 401) {
      console.log('\n🚨 POSSÍVEIS CAUSAS DO ERRO 401:');
      console.log('1. ❌ Senha incorreta');
      console.log('2. ❌ Usuário não encontrado');
      console.log('3. ❌ Conta desabilitada');
      console.log('4. ❌ Backend não está rodando');

      console.log('\n🔧 SOLUÇÕES:');
      console.log('- Verificar se backend está rodando (porta 3080)');
      console.log('- Usar credenciais corretas');
      console.log('- Resetar senha se necessário');
    }

    if (!error.response) {
      console.log('\n🚨 BACKEND NÃO RESPONDEU!');
      console.log('💡 Isso significa que:');
      console.log('- Backend não está rodando');
      console.log('- Firewall bloqueando a conexão');
      console.log('- Porta 3080 ocupada ou errada');

      console.log('\n🔧 SOLUÇÕES:');
      console.log('- Executar: npm run backend:dev');
      console.log('- Verificar porta no .env');
      console.log('- Verificar firewall/antivírus');
    }
  }
}

debugLogin();
