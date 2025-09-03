const axios = require('axios');

// Teste completo do backend - login e admin
const BASE_URL = 'http://localhost:3090';

async function debugBackend() {
  console.log('🔧 DIAGNÓSTICO COMPLETO DO BACKEND');
  console.log('='.repeat(50));

  try {
    // 1. Health check
    console.log('🩺 1. Health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health OK - Status ${health.status}`);

    // 2. Login test
    console.log('\n🔐 2. Teste de login...');
    const loginData = {
      email: 'deneralves@kaffco.com.br',
      password: 'admin123456'
    };

    console.log(`📧 Email: ${loginData.email}`);
    console.log(`🔑 Senha: ${loginData.password}`);

    const login = await axios.post(`${BASE_URL}/api/auth/login`, loginData, { timeout: 5000 });
    console.log(`✅ Login OK - Status ${login.status}`);
    console.log(`🔑 Token gerado: ${login.data.token ? 'SIM' : 'NÃO'}`);

    const token = login.data.token;

    // 3. Admin API test
    console.log('\n🏛️ 3. Teste da API de Admin...');
    const adminResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Admin API OK - Status ${adminResponse.status}`);
    console.log(`👥 Usuários encontrados: ${adminResponse.data.length}`);

    // 4. Resumo final
    console.log('\n🎯 RESULTADO DO DIAGNÓSTICO:');
    console.log('='.repeat(40));
    console.log('✅ Backend funcionando');
    console.log('✅ Login funcional');
    console.log('✅ API Admin acessível');
    console.log(`👤 Credenciais atuais:`);
    console.log(`   Email: ${loginData.email}`);
    console.log(`   Senha: ${loginData.password}`);
    console.log(`\n🎉 TUDO FUNCIONANDO! Painel admin habilitado.`);

  } catch (error) {
    console.log('\n❌ ERRO DETECTADO:');
    console.log('='.repeat(20));

    if (!error.response) {
      console.log('🚨 BACKEND NÃO ESTÁ RODANDO!');
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Execute: npm run backend:dev');
      console.log('2. Aguarde inicialização completa');
      console.log('3. Execute novamente: node debug-backend.js');
      return;
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.log(`🚨 Status: ${status}`);
    console.log(`💡 Mensagem: ${message}`);

    if (status === 401) {
      console.log('\n🔍 DIAGNÓSTICO: PROBLEMA DE AUTENTICAÇÃO');
      console.log('💡 Possíveis causas:');
      console.log('   1. Senha incorreta/diferente');
      console.log('   2. Usuário não existe');
      console.log('   3. Dependências faltando (bcrypt)');

    } else if (status === 500) {
      console.log('\n🔍 DIAGNÓSTICO: ERRO INTERNO NO SERVIDOR');
      console.log('💡 Possíveis causas:');
      console.log('   1. Configuração JWT incorreta');
      console.log('   2. MongoDB desconectado');
      console.log('   3. Dependências faltando');
      console.log('   4. Erro no código de autenticação');

    } else if (status === 404) {
      console.log('\n🔍 DIAGNÓSTICO: ENDPOINT NÃO ENCONTRADO');
      console.log('💡 Possíveis causas:');
      console.log('   1. Porta incorreta no código');
      console.log('   2. API route não implementado');
      console.log('   3. Build incorreto');
    }

    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Parar backend se estiver rodando: Ctrl+C');
    console.log('2. Reiniciar: npm run backend:dev');
    console.log('3. Se erro 500 persistir, instalar: npm install bcryptjs');
    console.log('4. Se erro de porta, verificar mudanca no .env');
  }
}

debugBackend();
