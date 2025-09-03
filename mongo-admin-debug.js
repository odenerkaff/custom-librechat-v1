/**
 * SCRIPT DE DEBUG COMPLETO - MongoDB + Painel Admin LibreChat
 * Identifica todos os possíveis problemas relacionados à conexão MongoDB
 * e autenticação do painel de administração
 */

const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ========== CONFIGURAÇÕES ==========
const FRONTEND_URL = 'http://localhost:3090';
const BACKEND_URL = 'http://localhost:3080';
const MONGO_URI = process.env.MONGO_URI ||
  "mongodb+srv://deneralves_db_user:MuGk1vdM93QjFkqh@db-dev-librechat.j3nnwlv.mongodb.net/librechat?retryWrites=true&w=majority&appName=db-dev-librechat";

console.log('🔍 INCIANDO DIAGNÓSTICO COMPLETO - MONGODB + PAINEL ADMIN\n');
console.log('='.repeat(80));

// ========== TESTE 1: STATUS GERAL DO SISTEMA ==========
async function testSystemStatus() {
  console.log('\n📊 TESTE 1: STATUS GERAL DO SISTEMA');
  console.log('-'.repeat(50));

  const status = {
    mongodb: false,
    backend: false,
    frontend: false,
    ports: false
  };

  // Test MongoDB connection
  console.log('🔍 Conectando ao MongoDB...');
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    status.mongodb = true;
    console.log('✅ MongoDB conectado');

    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log(`📊 Database: ${db.databaseName}`);
    console.log(`📋 Collections: ${collections.length}`);

    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ MongoDB falhou:', error.message);
    console.log('💡 Possíveis causas:');
    console.log('   - IP não na whitelist do MongoDB Atlas');
    console.log('   - Credenciais inválidas');
    console.log('   - Network/firewall bloqueando');
  }

  // Test Backend API
  console.log('\n🌐 Testando Backend API...');
  try {
    const health = await axios.get(`${BACKEND_URL}/health`, { timeout: 2000 });
    status.backend = true;
    console.log('✅ Backend respondendo (Porta 3080)');
  } catch (error) {
    console.log('❌ Backend não responde');
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend não está rodando na porta 3080');
    } else {
      console.log(`💡 Erro: ${error.message}`);
    }
  }

  // Test Frontend
  console.log('\n🌍 Testando Frontend...');
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 2000 });
    status.frontend = true;
    console.log('✅ Frontend respondendo (Porta 3090)');
  } catch (error) {
    console.log('❌ Frontend não responde');
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Frontend não está rodando na porta 3090');
    } else {
      console.log(`💡 Erro: ${error.message}`);
    }
  }

  return status;
}

// ========== TESTE 2: ANÁLISE DE AUTENTICAÇÃO ==========
async function testAuthentication() {
  console.log('\n🔐 TESTE 2: ANÁLISE DE AUTENTICAÇÃO');
  console.log('-'.repeat(50));

  // Test login endpoint
  console.log('🔑 Testando endpoint de login...');
  try {
    const loginData = {
      email: 'deneralves@kaffco.com.br',
      password: 'admin123456'
    };

    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, loginData, {
      timeout: 5000
    });

    if (response.data.token) {
      console.log('✅ Login bem-sucedido');
      console.log(`🔑 Token gerado: ${response.data.token.substring(0, 20)}...`);
      return { success: true, token: response.data.token, user: response.data.user };
    } else {
      console.log('⚠️ Login sem token retornado');
      return { success: false, error: 'No token in response' };
    }
  } catch (error) {
    console.log('❌ Login falhou:', error.response?.data?.message || error.message);

    if (error.response?.status === 500) {
      console.log('💡 Erro 500 - possível problema de banco de dados');
      console.log('💡 Verifique logs do backend');
    } else if (error.response?.status === 401) {
      console.log('💡 Credenciais incorretas');
    }

    return { success: false, error: error.message, status: error.response?.status };
  }
}

// ========== TESTE 3: ANÁLISE DO TOKEN JWT ==========
async function testJWTToken(loginResult) {
  console.log('\n🎫 TESTE 3: ANÁLISE DO TOKEN JWT');
  console.log('-'.repeat(50));

  if (!loginResult.success) {
    console.log('⏭️ Pulando teste JWT (login falhou)');
    return { success: false, reason: 'Login failed' };
  }

  const token = loginResult.token;

  // Decode token (não verifica assinatura, apenas decodifica)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('✅ Token válido (formato JWT)');
    console.log(`👤 Usuário: ${payload.id || 'unknown'}`);
    console.log(`📅 Expira: ${new Date(payload.exp * 1000).toLocaleString()}`);
    console.log(`🔒 Role: ${payload.role || 'USER'}`);

    return { success: true, payload };
  } catch (error) {
    console.log('❌ Token inválido (não é JWT):', error.message);
    return { success: false, error: error.message };
  }
}

// ========== TESTE 4: ANÁLISE DO PANEL ADMIN ==========
async function testAdminPanel(loginResult) {
  console.log('\n🏛️ TESTE 4: ANÁLISE DO PANEL ADMIN');
  console.log('-'.repeat(50));

  if (!loginResult.success) {
    console.log('⏭️ Pulando teste Admin (login falhou)');
    return { success: false, reason: 'Login failed' };
  }

  const token = loginResult.token;

  // Test admin users endpoint
  console.log('👥 Testando endpoint /api/admin/users...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    if (response.status === 200) {
      console.log('✅ API Admin funcionando');
      console.log(`📊 Usuários encontrados: ${response.data.length}`);
      return { success: true, users: response.data };
    }
  } catch (error) {
    console.log(`❌ API Admin falhou (Status: ${error.response?.status})`);
    console.log(`💡 Erro: ${error.response?.data?.message || error.message}`);

    if (error.response?.status === 401) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: TOKEN NÃO AUTORIZADO');
      console.log('💡 Possíveis causas:');
      console.log('   1. Token expirado');
      console.log('   2. Token inválido/corrompido');
      console.log('   3. Middleware de autenticação com problema');
      console.log('   4. Configuração JWT incorreta');
    } else if (error.response?.status === 403) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: ACESSO NEGADO');
      console.log('💡 Possíveis causas:');
      console.log('   1. Usuário não tem role ADMIN');
      console.log('   2. Middleware checkAdmin bloqueando');
      console.log('   3. Database com problema');
    } else if (error.response?.status === 500) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: ERRO INTERNO DO SERVIDOR');
      console.log('💡 Possíveis causas:');
      console.log('   1. MongoDB desconectado');
      console.log('   2. Erro no controller AdminController');
      console.log('   3. Problema na query do banco');
      console.log('   4. Erro de permissões');
    }

    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      problems: analyzeProblems(error)
    };
  }
}

// ========== ANÁLISE DE PROBLEMAS ==========
function analyzeProblems(error) {
  const problems = [];

  if (error.response?.status === 401) {
    problems.push({
      type: 'AUTHENTICATION',
      description: 'Token JWT não autorizado',
      solutions: [
        'Verificar se o token JWT está válido',
        'Testar login manualmente',
        'Verificar chaves JWT_SECRET e JWT_REFRESH_SECRET no .env',
        'Limpar cookies do navegador',
        'Forçar logout e login novamente'
      ]
    });
  }

  if (error.response?.status === 403) {
    problems.push({
      type: 'AUTHORIZATION',
      description: 'Acesso negado ao painel admin',
      solutions: [
        'Verificar se o usuário tem role ADMIN no banco',
        'Testar middleware requireJwtAuth',
        'Testar middleware checkAdmin',
        'Atualizar configurações de roles'
      ]
    });
  }

  if (error.response?.status === 500) {
    problems.push({
      type: 'SERVER_ERROR',
      description: 'Erro interno do servidor',
      solutions: [
        'Verificar conexção MongoDB',
        'Verificar logs do backend',
        'Testar query do AdminController',
        'Verificar configurações de ambiente'
      ]
    });
  }

  if (error.code === 'ECONNREFUSED') {
    problems.push({
      type: 'CONNECTION',
      description: 'Servidor não responde',
      solutions: [
        'Verificar se backend está rodando',
        'Verificar porta 3080',
        'Testar firewall/antivírus',
        'Verificar configurações de proxy'
      ]
    });
  }

  return problems;
}

// ========== TESTE 5: VERIFICAÇÃO DE CONFIGURAÇÕES ==========
async function checkConfiguration() {
  console.log('\n⚙️ TESTE 5: VERIFICAÇÃO DE CONFIGURAÇÕES');
  console.log('-'.repeat(50));

  const config = {
    mongodb: true,
    jwtTokens: true,
    cors: true,
    environment: true
  };

  // Check .env file
  console.log('📄 Verificando arquivo .env...');
  const envPath = path.join(__dirname, '.env');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Arquivo .env encontrado');

    // Check critical variables
    const requiredVars = {
      MONGO_URI: !!envContent.match(/^MONGO_URI=.+/m),
      JWT_SECRET: !!envContent.match(/^JWT_SECRET=.+/m),
      JWT_REFRESH_SECRET: !!envContent.match(/^JWT_REFRESH_SECRET=.+/m)
    };

    Object.entries(requiredVars).forEach(([key, exists]) => {
      if (exists) {
        console.log(`✅ ${key} configurada`);
      } else {
        console.log(`❌ ${key} não encontrada`);
        config.environment = false;
      }
    });
  } else {
    console.log('❌ Arquivo .env não encontrado');
    config.environment = false;
  }

  return config;
}

// ========== FUNÇÃO PRINCIPAL ==========
async function runCompleteDiagnostic() {
  console.log('🚀 EXECUTANDO DIAGNÓSTICO COMPLETO...');
  console.log('⏱️ Isso pode levar alguns segundos...\n');

  try {
    // Test system status
    const systemStatus = await testSystemStatus();

    // Test authentication
    const authResult = await testAuthentication();

    // Test JWT token
    const jwtResult = await testJWTToken(authResult);

    // Test admin panel
    const adminResult = await testAdminPanel(authResult);

    // Check configuration
    const configStatus = await checkConfiguration();

    // ========== RESUMO FINAL ==========
    console.log('\n📊 RESUMO FINAL DOS TESTES');
    console.log('='.repeat(80));

    const allTests = {
      'Sistema (MongoDB, Backend, Frontend)': systemStatus,
      'Autenticação (Login)': authResult.success,
      'Token JWT': jwtResult.success,
      'Painel Admin': adminResult.success,
      'Configurações': configStatus.environment
    };

    let passedTests = 0;
    let totalTests = Object.keys(allTests).length;

    Object.entries(allTests).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSOU' : '❌ FALHOU';
      console.log(`${status}: ${test}`);
      if (passed) passedTests++;
    });

    console.log('\n🔢 RESULTADO GERAL:');
    console.log(`📊 Testes bem-sucedidos: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log('🎉 PARABÉNS! Todos os testes passaram!');
      console.log('✅ Sistema funcionando perfeitamente.');
    } else {
      console.log(`⚠️ Foram encontrados ${totalTests - passedTests} problema(s)`);

      // Diagnostics for failed tests
      if (!systemStatus.mongodb) {
        console.log('\n🔸 DIAGNÓSTICO MONGODB:');
        console.log('💡 Verifique:');
        console.log('   1. IP público na whitelist do MongoDB Atlas');
        console.log('   2. Credenciais corretas no MONGO_URI');
        console.log('   3. Firewall não bloqueando porta 27017');
      }

      if (!authResult.success) {
        console.log('\n🔸 DIAGNÓSTICO AUTENTICAÇÂO:');
        console.log('💡 Verifique:');
        console.log('   1. Credenciais do usuário (email/senha)');
        console.log('   2. Usuário existe no banco de dados');
        console.log('   3. Backend rodando corretamente');
      }

      if (!jwtResult.success) {
        console.log('\n🔸 DIAGNÓSTICO JWT:');
        console.log('💡 Verifique:');
        console.log('   1. JWT_SECRET definido no .env');
        console.log('   2. Frontend enviando token corretamente');
        console.log('   3. Token não expirado');
      }

      if (!adminResult.success) {
        console.log('\n🔸 DIAGNÓSTICO PAINEL ADMIN:');
        console.log('💡 Verifique:');
        console.log('   1. Usuário tem role ADMIN');
        console.log('   2. MongoDB conectada');
        console.log('   3. Middleware funcionando');
        console.log('   4. Table users existe e populada');

        if (adminResult.problems) {
          console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
          adminResult.problems.forEach((problem, index) => {
            console.log(`${index + 1}. ${problem.description}`);
            problem.solutions.forEach(solution => {
              console.log(`   ✓ ${solution}`);
            });
          });
        }
      }
    }

    // Detailed information
    console.log('\n📋 INFORMAÇÕES DETALHADAS:');

    if (systemStatus.mongodb && adminResult.success) {
      console.log('🐳 MongoDB conectada e acessível');
    } else {
      console.log('🐳 MongoDB: CONEXÃO INDISPONÍVEL');
    }

    console.log(`🔑 JWT Configurado: ${Object.values(configStatus).every(v => v) ? 'SIM' : 'NÃO'}`);
    console.log(`🔐 Login Funcionando: ${authResult.success ? 'SIM' : 'NÃO'}`);
    console.log(`📊 Painel Admin: ${adminResult.success ? 'FUNCIONANDO' : 'COM PROBLEMAS'}`);

    if (adminResult.users) {
      console.log(`👥 Total de Usuários: ${adminResult.users.length}`);
      const adminUsers = adminResult.users.filter(u => u.role === 'ADMIN');
      console.log(`👨‍💼 Admins Encontrados: ${adminUsers.length}`);
    }

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO durante diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO');
  console.log('📝 Use as informações acima para resolver os problemas identificados');
}

// ========== EXECUÇÃO ==========
if (require.main === module) {
  runCompleteDiagnostic().catch(console.error);
}

module.exports = { runCompleteDiagnostic, testSystemStatus, testAuthentication, testAdminPanel };
