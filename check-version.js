const axios = require('axios');

async function checkVersion() {
  console.log('🔍 VERIFICANDO VERSÃO DA APLICAÇÃO');
  console.log('='.repeat(50));

  try {
    // Testar frontend para ver que aplicação está rodando
    console.log('\n🌐 Testando frontend (porta 3090)...');
    const response = await axios.get('http://localhost:3090/', {
      timeout: 3000
    });

    console.log('✅ Frontend respondendo');
    console.log('📄 Tamanho HTML:', response.data.length, 'caracteres');

    // Verificar se tem elementos do painel admin
    const hasAdminPanel = response.data.includes('Admin') ||
                         response.data.includes('admin') ||
                         response.data.includes('Settings') ||
                         response.data.includes('Configurações');

    const hasLogin = response.data.includes('login') ||
                    response.data.includes('Login') ||
                    response.data.includes('auth') ||
                    response.data.includes('Entrar');

    console.log('\n🔍 ANÁLISE DA VERSÃO:');
    console.log('='.repeat(30));

    console.log(`✅ Login form detectado: ${hasLogin ? 'SIM' : 'NÃO'}`);
    console.log(`🏛️ Admin panel detectado: ${hasAdminPanel ? 'SIM' : 'NÃO'}`);

    // Verificar versão no HTML
    const versionMatch = response.data.match(/<!--\s*(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      console.log(`📋 Versão detectada: ${versionMatch[1]}`);
    }

    // Verificar se é a versão com painel admin
    if (hasAdminPanel && hasLogin) {
      console.log('\n🎉 VERSÃO: MODERNA (Admin Panel incluído)');
      console.log('🟢 Painel de administração disponível');
    } else if (hasLogin && !hasAdminPanel) {
      console.log('\n⚠️ VERSÃO: INTERMEDIÁRIA (Login funcional, admin limitado)');
      console.log('🔶 Painel admin pode estar oculto ou não implementado');
    } else {
      console.log('\n🚨 VERSÃO: DESATUALIZADA');
      console.log('❌ Login e admin não funcionais');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 ERRO: Aplicação não está rodando na porta 3090');
      console.log('🚀 Inicie com: npm run backend:dev');
    } else {
      console.log('\n❌ ERRO ao testar aplicação:', error.message);
      console.log('🔧 Verifique se a aplicação está funcionando corretamente');
    }
  }
}

checkVersion();
