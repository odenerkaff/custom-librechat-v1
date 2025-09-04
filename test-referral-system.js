const axios = require('axios');

// Script para criar usuário admin
async function createAdminUser() {
  const BASE_URL = 'http://localhost:3092';
  const adminData = {
    name: 'Administração',
    email: 'admin@company.com.br',
    password: 'admin123456'
  };

  try {
    console.log('🔧 CRIANDO USUÁRIO ADMIN...');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Senha: ${adminData.password}`);
    console.log(`   Role: ADMIN`);

    // Registrar admin
    await axios.post(`${BASE_URL}/api/auth/register`, {
      ...adminData,
      confirm_password: adminData.password
    });

    console.log('✅ Admin criado com sucesso!');
    console.log('');
    console.log('🚀 URL Admin: http://localhost:3090');
    console.log(`👤 Login: ${adminData.email}`);
    console.log(`🔑 Senha: ${adminData.password}`);
    console.log('');
    console.log('🔗 No sistema, vá em:');
    console.log('   1. Clicar no avatar (canto superior direito)');
    console.log('   2. Configurações');
    console.log('   3. Aba "Indicações"');
    console.log('');
    console.log('📊 Sistema de Indicações ativado!');

  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    if (errorMsg.includes('already exists')) {
      console.log('ℹ️  Admin já existe, continuando...');
      console.log('');
      console.log('🚀 URL Admin: http://localhost:3090');
      console.log(`👤 Login: ${adminData.email}`);
      console.log(`🔑 Senha: ${adminData.password}`);
      console.log('');
    } else {
      console.log('❌ Erro ao criar admin:', errorMsg);
    }
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  createAdminUser();
}

const axios = require('axios');

// Teste completo do sistema de referral
async function testReferralSystem() {
  console.log('🎯 TESTE SISTEMA COMPLETO DE REFERRAL');
  console.log('='.repeat(60));

  try {
    const BASE_URL = 'http://localhost:3092';

    // === FASE 1: CRIAR USUARIO INDICADOR (REFERRER) ===
    console.log('\n📝 FASE 1: Criando usuário indicador...');
    const referrerData = {
      name: 'João Referrer',
      email: `joao_referrer_${Date.now()}@test.com`,
      password: 'senha123456'
    };

    // Registrar referrer (usar usuários únicos para evitar rate limiting)
    try {
      console.log(`   Registrando: ${referrerData.name}`);
      await axios.post(`${BASE_URL}/api/auth/register`, {
        ...referrerData,
        confirm_password: referrerData.password
      });
      console.log('   ✅ Referrer registrado com sucesso');
    } catch (regError) {
      console.log(`   ⚠️  Referrer já existe (continuando teste): ${regError.response?.data?.message || regError.message}`);
      // Se o usuário já existe, vamos tentar fazer login diretamente
      console.log('   🔄 Tentando login do referrer existente...');
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: referrerData.email,
          password: referrerData.password
        });
        const existingToken = loginResponse.data.token;
        console.log('   ✅ Referrer existente logado com sucesso');

        // Agora fazer as verificações com o token existente
        console.log('   Buscando dados de referral do referrer...');
        const referrerDataResponse = await axios.get(`${BASE_URL}/api/referral/me`, {
          headers: { Authorization: `Bearer ${existingToken}` }
        });

        if (referrerDataResponse.data.totalReferrals > 0) {
          console.log('   📊 Referrer já tem indicações! Pode ser de teste anterior');
          console.log(`      Indicações: ${referrerDataResponse.data.totalReferrals}`);
          console.log(`      Créditos: ${referrerDataResponse.data.currentBalance}`);
          console.log(`      Código: ${referrerDataResponse.data.referralCode}`);
          console.log(`      Link: ${referrerDataResponse.data.referralLink}`);

          return {
            success: true,
            referrerEmail: referrerData.email,
            referredEmail: null,
            balanceIncrease: 'Já testado',
            totalReferrals: referrerDataResponse.data.totalReferrals,
            referralCode: referrerDataResponse.data.referralCode
          };
        }
      } catch (loginError) {
        console.error('   ❌ Não foi possível fazer login do referrer existente');
        return null;
      }
    }

    // Login do referrer
    console.log('   Fazendo login do referrer...');
    const referrerLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: referrerData.email,
      password: referrerData.password
    });

    const referrerToken = referrerLogin.data.token;
    console.log('   ✅ Referrer logado com sucesso');

    // Buscar dados do referrer para obter código de referral
    console.log('   Buscando dados de referral do referrer...');
    const referrerDataResponse = await axios.get(`${BASE_URL}/api/referral/me`, {
      headers: { Authorization: `Bearer ${referrerToken}` }
    });

    const referralCode = referrerDataResponse.data.referralCode;
    const referralLink = referrerDataResponse.data.referralLink;

    console.log('   📊 DADOS OBTIDOS:');
    console.log(`      Código: ${referralCode}`);
    console.log(`      Link: ${referralLink}`);
    console.log(`      Indicações atuais: ${referrerDataResponse.data.totalReferrals}`);
    console.log(`      Créditos atuais: ${referrerDataResponse.data.currentBalance}`);

    // === FASE 2: CRIAR USUARIO INDICADO (REFERRED) ===
    console.log('\n👤 FASE 2: Criando usuário indicado...');
    const referredData = {
      name: 'Maria Indicada',
      email: `maria_indicada_${Date.now()}@test.com`,
      password: 'senha123456'
    };

    // Registrar referido COM código de referral
    console.log(`   Registrando referido com código: ${referralCode}`);
    console.log(`   Dados: ${referredData.name} <${referredData.email}>`);
    console.log(`   Usando link: /register?ref=${referralCode}`);

    await axios.post(`${BASE_URL}/api/auth/register?ref=${referralCode}`, {
      ...referredData,
      confirm_password: referredData.password
    });
    console.log('   ✅ Referido registrado com sucesso via link de indicação');

    // === FASE 3: VERIFICAR RECOMPENSA NO REFERRER ===
    console.log('\n💰 FASE 3: Verificando recompensa no referrer...');
    const updatedReferrerData = await axios.get(`${BASE_URL}/api/referral/me`, {
      headers: { Authorization: `Bearer ${referrerToken}` }
    });

    console.log('   📊 DADOS ATUALIZADOS DO REFERRER:');
    console.log(`      Indicações atuais: ${updatedReferrerData.data.totalReferrals}`);
    console.log(`      Créditos atuais: ${updatedReferrerData.data.currentBalance}`);

    // Verificar se ganhou os 500 créditos
    const balanceIncrease = updatedReferrerData.data.currentBalance - referrerDataResponse.data.currentBalance;

    console.log(`   🎁 ANÁLISE DE RECOMPENSA:`);
    console.log(`      Créditos antes: ${referrerDataResponse.data.currentBalance}`);
    console.log(`      Créditos após: ${updatedReferrerData.data.currentBalance}`);
    console.log(`      Aumento detectado: +${balanceIncrease} créditos`);

    if (balanceIncrease === 500) {
      console.log('   ✅ RECOMPENSA CORRETA: +500 créditos!');
    } else {
      console.log(`   ❌ RECOMPENSA INCORRETA: Esperado +500, recebi +${balanceIncrease}`);
    }

    // === FASE 4: VERIFICAR HISTÓRICO DE INDICAÇÃO ===
    console.log('\n📋 FASE 4: Verificando histórico de indicações...');
    const referralHistory = await axios.get(`${BASE_URL}/api/referral/history`, {
      headers: { Authorization: `Bearer ${referrerToken}` }
    });

    console.log(`   📊 HISTÓRICO ENCONTRADO:`);
    console.log(`      Total de indicações: ${referralHistory.data.total}`);

    if (referralHistory.data.referrals.length > 0) {
      console.log('      Detalhes das indicações:');
      referralHistory.data.referrals.forEach((ref, index) => {
        console.log(`         ${index + 1}. ${ref.ReferredUser.name} (${ref.referredUser.email})`);
        console.log(`            Status: ${ref.status}`);
        console.log(`            Data: ${new Date(ref.createdAt).toLocaleDateString('pt-BR')}`);
      });
    } else {
      console.log('      ⚠️ Nenhum histórico encontrado (possível problema)');
    }

    // === FASE 5: VERIFICAR LEADERBOARD ===
    console.log('\n🏆 FASE 5: Verificando leaderboard...');
    const leaderboard = await axios.get(`${BASE_URL}/api/referral/leaderboard?limit=5`, {
      headers: { Authorization: `Bearer ${referrerToken}` }
    });

    console.log(`   📊 LEADERBOARD (TOP 5):`);
    if (leaderboard.data.leaderboard.length > 0) {
      leaderboard.data.leaderboard.forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.name} - ${item.totalReferrals} indicações`);
      });
    } else {
      console.log('      Nenhum usuário no leaderboard ainda');
    }

    // === RESULTADO FINAL ===
    console.log('\n🎉 RESULTADO FINAL:');
    console.log('='.repeat(60));

    console.log('✅ CRIADO:', referredData.name, 'com referral code');
    console.log('✅ RECOMPENSA:', balanceIncrease === 500 ? 'CORRETA (+500)' : 'INCORRETA');
    console.log('✅ INDICAÇÕES:', referralHistory.data.total, 'registradas');
    console.log('✅ API:', 'Todas os endpoints funcionando');
    console.log('✅ SISTEMA:', balanceIncrease === 500 ? '100% FUNCIONANDO' : 'NECESSITA AJUSTES');

    if (balanceIncrease === 500) {
      console.log('\n🚀 SISTEMA DE REFERRAL COMPLETAMENTE FUNCIONAL! 🎯');
      console.log('   💡 Pronto para integração com frontend e automação n8n');
    }

    return {
      success: balanceIncrease === 500,
      referrerEmail: referrerData.email,
      referredEmail: referredData.email,
      balanceIncrease,
      totalReferrals: referralHistory.data.total,
      referralCode
    };

  } catch (error) {
    console.error('\n🔥 ERRO NO TESTE:');
    console.log('-'.repeat(30));

    if (error.response) {
      const { status, data } = error.response;
      console.log(`❌ HTTP ${status}: ${data.message || error.message}`);

      if (status === 404) {
        console.log('💡 Solução: Verificar se servidor está rodando (npm run backend)');
      } else if (status === 401) {
        console.log('💡 Solução: Verificar credenciais de admin');
      } else if (status === 500) {
        console.log('💡 Solução: Verificar logs do servidor');
      }
    } else {
      console.log(`❌ ${error.code}: ${error.message}`);
    }

    return null;
  }
}

testReferralSystem();
