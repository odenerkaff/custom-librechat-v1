const axios = require('axios');

// URLs CORRETAS baseadas no teste
const BASE_URL = 'http://localhost:3091';

async function finalDiag() {
  console.log('🎯 DIAGNÓSTICO FINAL - PORTA CORRETA (3091)');
  console.log('='.repeat(60));

  try {
    console.log('🔗 BASE_URL config: reta:', BASE_URL);

    // 1. Health check com timeout aumentado
    console.log('\n🩺 1. Health check...');
    const health = await axios.get(`${BASE_URL}/health`, { timeout: 10000 });
    console.log(`✅ Health OK - Status: ${health.status}`);

    // 2. Login test - credenciais corretas
    console.log('\n🔐 2. Teste de login...');
    const loginData = {
      email: 'deneralves@kaffco.com.br',
      password: 'admin123456'
    };

    console.log(`📧 Email: ${loginData.email}`);
    console.log(`🔑 Senha: ${loginData.password}`);

    const login = await axios.post(`${BASE_URL}/api/auth/login`, loginData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const status = login.status;
    console.log(`📊 Login Status: ${status}`);

    if (status === 200 && login.data.token) {
      console.log('🎉 LOGIN BEM-SUCEDIDO!');
      console.log(`🔑 Token: ${login.data.token.substring(0, 30)}...`);
      console.log(`👤 User ID: ${login.data.user?.id || 'unknown'}`);
      console.log(`🏆 Role: ${login.data.user?.role || 'unknown'}`);

      const token = login.data.token;

      // 3. Teste Admin API
      console.log('\n🏛️ 3. Teste Admin Panel...');

      const adminResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (adminResponse.status === 200) {
        console.log('✅ PAINEL ADMIN FUNCIONANDO!');
        console.log(`👥 Total usuários: ${adminResponse.data.length}`);

        // Mostrar primeiros usuários
        if (adminResponse.data.length > 0) {
          console.log('\n📋 USUÁRIOS ENCONTRADOS:');
          adminResponse.data.slice(0, 3).forEach((user, i) => {
            console.log(`${i+1}. ${user.name} (${user.email}) - ${user.role}`);
          });
        }

        console.log('\n🎊 TUDO FUNCIONANDO PERFEITAMENTE!');

        return {
          success: true,
          login: true,
          admin: true,
          users_count: adminResponse.data.length
        };
      }

    } else {
      console.log('❌ Login retornou dados inesperados');
      console.log('🔍 Resposta:', JSON.stringify(login.data, null, 2));
    }

  } catch (error) {
    console.log('\n🚨 ERRO DETECTADO:');
    console.log('='.repeat(30));

    if (error.code === 'ECONNREFUSED') {
      console.log('🚫 SERVIDOR NÃO RESPONDE!');
      console.log('💡 Porta 3091 pode não estar rodando');
      return { success: false, error: 'Server not responding' };
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.log(`📊 HTTP Status: ${status}`);
    console.log(`💬 Mensagem: ${message}`);

    if (status === 500) {
      console.log('\n🔍 ANÁLISE DO ERRO 500:');
      console.log('💡 Servidor não conseguiu processar a requisição');
      console.log('💡 Possíveis causas:');
      console.log('   • MongoDB desconectado');
      console.log('   • Dependência bcrypt faltando');
      console.log('   • Erro no código de autenticação');
      console.log('   • Configuração JWT incorreta');

      return { success: false, error: 'Internal server error', status: 500 };
    }

    if (status === 401) {
      console.log('\n🔍 ANÁLISE DO ERRO 401:');
      console.log('💡 Credenciais inválidas ou token expirado');
      console.log('💡 Verifique:');
      console.log('   • Email e senha corretos');
      console.log('   • Usuário existe no banco');
      console.log('   • Conta não está desabilitada');

      return { success: false, error: 'Authentication failed', status: 401 };
    }

    return { success: false, error: message, status };
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTE FINAL');
  console.log('Porta correta identificada: 3091');
  console.log('=====================================\n');

  const result = await finalDiag();

  console.log('\n📊 RESULTADO FINAL:');
  console.log('='.repeat(25));

  if (result.success) {
    console.log('🎉 SUCESSO TOTAL!');
    console.log('   ✅ Health check');
    console.log('   ✅ Login autenticado');
    console.log('   ✅ Painel admin funcional');
    console.log('   ✅ Sistema completamente operacional');

    console.log('\n🔑 CREDENCIAIS PARA ACESSO:');
    console.log('   📧 Email: deneralves@kaffco.com.br');
    console.log('   🔑 Senha: admin123456');
    console.log('   🏠 Painel: http://localhost:3091');

  } else {
    console.log('❌ TESTES COM PROBLEMAS');
    console.log(`   Status: ${result.status || 'Unknown'}`);
    console.log(`   Erro: ${result.error}`);

    console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');

    if (result.status === 500) {
      console.log('1. Reinicie backend: npm run backend:dev');
      console.log('2. Instale dependências: npm install');
      console.log('3. Verifique MongoDB: node simple-user-check.js');
    }

    if (result.status === 401) {
      console.log('1. Verifique credenciais');
      console.log('2. Reset senha: node reset-admin-password.js');
      console.log('3. Verifique usuário: node simple-user-check.js');
    }

    if (result.error === 'Server not responding') {
      console.log('1. Verifique se backend está rodando');
      console.log('2. Execute: npm run backend:dev');
      console.log('3. Aguarde inicialização completa');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { finalDiag, main };
