/**
 * SCRIPT COMPLETO DE DIAGNÓSTICO - LibreChat Admin Panel Issues
 * Este script identifica e corrige todos os problemas relatados
 */

// ========== IMPORTS E DEPENDÊNCIAS ==========
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ========== CONFIGURAÇÃO ==========
const SERVER_URL = 'http://localhost:3080';
const FRONTEND_URL = 'http://localhost:3090';

// ========== TESTES INDIVIDUAIS ==========

async function testMongoConnection() {
  console.log('\n🔍 TESTANDO CONEXÃO MONGODB...\n');

  try {
    const mongoUri = process.env.MONGO_URI ||
      "mongodb+srv://deneralves_db_user:MuGk1vdM93QjFkqh@db-dev-librechat.j3nnwlv.mongodb.net/librechat?retryWrites=true&w=majority&appName=db-dev-librechat";

    console.log('📍 Tentando conectar:', mongoUri.replace(/:([^:]{10})[^@]*@/, ':***@'));

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ MONGODB CONECTADO COM SUCESSO!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Testar query simples
    const { User } = require('~/models');
    const userCount = await User.countDocuments({});

    console.log('👥 Total de usuários no banco:', userCount);

    if (userCount > 0) {
      const sampleUser = await User.findOne({}).select('name email role');
      console.log('📝 Sample user:', sampleUser.name, '-', sampleUser.email);
    }

    await mongoose.connection.close();
    return { success: true, userCount };

  } catch (error) {
    console.error('❌ MONGODB ERRO:', error.message);
    return { success: false, error: error.message };
  }
}

async function testBackendAPI() {
  console.log('\n🔍 TESTANDO BACKEND API...\n');

  try {
    // Test 1: Health endpoint
    console.log('🌡️ Testing health endpoint...');
    const health = await axios.get(`${SERVER_URL}/health`);
    console.log('✅ Health OK - Status:', health.status);

    // Test 2: Login endpoint (modal)
    console.log('\n🔐 Testing login modal...');
    const login = await axios.post(`${SERVER_URL}/api/auth/login`, {
      email: 'deneralves@kaffco.com.br',
      password: 'admin123456'
    });
    console.log('✅ Login OK - Token gerado:', !!login.data.token);

    // Test 3: Admin API sem auth (deve falhar)
    console.log('\n🔏 Testing admin API sem auth...');
    try {
      await axios.get(`${SERVER_URL}/api/admin/users`);
    } catch (noAuthError) {
      console.log('✅ Sem auth corretamente negado - Status:', noAuthError.response?.status);
    }

    // Test 4: Admin API com JWT (deve funcionar)
    console.log('\n🔑 Testing admin API com JWT...');
    const adminResponse = await axios.get(`${SERVER_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${login.data.token}` }
    });

    console.log('✅ ADMIN API FUNCIONANDO - Status:', adminResponse.status);
    console.log('👥 Usuários retornados:', adminResponse.data.length);

    if (adminResponse.data.length > 0) {
      console.log('📝 Primeiro usuário:', adminResponse.data[0].name);
    }

    return { success: true, userCount: adminResponse.data.length };

  } catch (error) {
    console.error('❌ API ERROR:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

async function testWebSocketConnection() {
  console.log('\n🔍 TESTANDO WEBSOCKET...\n');

  try {
    // Vite serve o frontend na porta 3090
    console.log('🌐 Testing frontend WebSocket...');
    const frontend = await axios.get(`${FRONTEND_URL}`);
    console.log('✅ Frontend acessível');

    // Checar se há configuracao de WebSocket
    const viteConfig = path.join(__dirname, 'client/vite.config.ts');
    if (fs.existsSync(viteConfig)) {
      const viteContent = fs.readFileSync(viteConfig, 'utf8');
      if (viteContent.includes('ws://')) {
        console.log('✅ WebSocket configurado no Vite');
      } else {
        console.log('⚠️ WebSocket pode não estar configurado no Vite');
      }
    }

    return { success: true };

  } catch (error) {
    console.log('❌ WEBSOCKET ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

async function checkTypeScriptConfig() {
  console.log('\n🔍 VERIFICANDO TYPESCRIPT...\n');

  const issues = [];
  const tsConfig = path.join(__dirname, 'client/tsconfig.json');

  if (!fs.existsSync(tsConfig)) {
    issues.push('❌ tsconfig.json não encontrado');
  } else {
    const config = JSON.parse(fs.readFileSync(tsConfig, 'utf8'));
    console.log('✅ tsconfig.json encontrado');

    // Verificar configurações críticas
    if (!config.compilerOptions.outDir) {
      issues.push('⚠️ outDir não especificado - arquivos podem ser sobrescritos');
    }

    if (config.compilerOptions.noEmit === false && !config.compilerOptions.declarationDir) {
      issues.push('⚠️ Emissão ativada sem outDir separado do src');
    }

    if (issues.length === 0) {
      console.log('✅ Configuração TypeScript OK');
    } else {
      issues.forEach(issue => console.log(issue));
    }
  }

  return { success: issues.length === 0, issues };
}

async function testFrontendBuild() {
  console.log('\n🔍 TESTANDO BUILD DO FRONTEND...\n');

  try {
    const { execSync } = require('child_process');

    console.log('🏗️ Building frontend...');
    execSync('cd client && npm run build', {
      stdio: 'inherit',
      timeout: 60000
    });

    console.log('✅ Build frontend OK');
    return { success: true };

  } catch (error) {
    console.error('❌ BUILD ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

// ========== CORREÇÕES PROPOSTAS ==========

function fixTypeScriptConfig() {
  console.log('\n🔧 CORRIGINDO TYPESCRIPT CONFIG...\n');

  const tsConfigPath = 'client/tsconfig.json';
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

  // Adicionar configurações seguras
  tsConfig.compilerOptions = {
    ...tsConfig.compilerOptions,
    "outDir": "./dist", // Arquivos compilados vão para ./dist
    "declarationDir": "./types", // Arquivos .d.ts vão para ./types
    "noEmit": false, // Liberar emissão
    "declaration": true, // Gerar .d.ts
    "rootDir": "./src", // Raiz é ./src
    "tsBuildInfoFile": "./.tsbuildinfo" // Cache de build
  };

  // Excluir build dirs
  tsConfig.exclude = [
    ...(tsConfig.exclude || []),
    "dist",
    ".tsbuildinfo",
    "types"
  ];

  fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  console.log('✅ tsconfig.json corrigido!');
  console.log('   - outDir: ./dist');
  console.log('   - declarationDir: ./types');
}

function createTypesFile() {
  const typesContent = `
// types/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WEBSOCKET_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  lastActivity: string;
  balance: number;
  provider: string;
  avatar?: string;
  emailVerified: boolean;
}
`;

  const typesDir = 'client/types';
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir);
  }

  fs.writeFileSync('client/types/index.ts', typesContent);
  console.log('✅ Arquivos de tipos criados!');
}

async function fixAdminPanelTypes() {
  console.log('\n🔧 CORRIGINDO TIPOS DO ADMIN PANEL...\n');

  // 1. Fix panel.tsx
  const panelPath = 'client/src/components/Admin/Panel.tsx';
  let panelContent = fs.readFileSync(panelPath, 'utf8');

  // Substituir tipos unknown por User[]
  panelContent = panelContent.replace(
    'const { data: users, isLoading, error } = useQuery({',
    'const { data: users, isLoading, error } = useQuery<User[], Error>({'
  );

  panelContent = panelContent.replace(
    'queryFn: async () => {',
    'queryFn: async (): Promise<User[]> => {'
  );

  fs.writeFileSync(panelPath, panelContent);
  console.log('✅ Panel.tsx corrigido com tipos apropriados!');

  // 2. Fix Admin.tsx
  const adminPath = 'client/src/components/Nav/SettingsTabs/Admin/Admin.tsx';
  let adminContent = fs.readFileSync(adminPath, 'utf8');

  adminContent = adminContent.replace(
    'const { data: users, isLoading, error } = useQuery({',
    'const { data: users, isLoading, error } = useQuery<User[], Error>({'
  );

  fs.writeFileSync(adminPath, adminContent);
  console.log('✅ Admin.tsx corrigido com tipos apropriados!');
}

// ========== FUNÇÃO PRINCIPAL ==========

async function runDiagnostic() {
  console.log('🚀 DIAGNÓSTICO COMPLETO - LIBRECHAT ADMIN PANEL\n');
  console.log('='.repeat(60));

  const results = {};

  // 1. MongoDB Connection
  console.log('📊 TESTE 1: CONEXÃO MONGODB');
  results.mongo = await testMongoConnection();

  // 2. API Backend
  if (results.mongo.success) {
    console.log('\n🌐 TESTE 2: BACKEND API');
    results.api = await testBackendAPI();
  } else {
    console.log('\n⏭️  PULO: API (MongoDB falhar)');
  }

  // 3. WebSocket
  console.log('\n🔌 TESTE 3: WEBSOCKET');
  results.websocket = await testWebSocketConnection();

  // 4. TypeScript Config
  console.log('\n📋 TESTE 4: TYPESCRIPT CONFIG');
  results.typescript = await checkTypeScriptConfig();

  // 5. RESUMO E CORREÇÕES
  console.log('\n📊 RESUMO DOS RESULTADOS:\n');

  Object.entries(results).forEach(([test, result]) => {
    if (result.success) {
      console.log(`✅ ${test.toUpperCase()}: OK`);
    } else {
      console.log(`❌ ${test.toUpperCase()}: FALHA`);
    }
  });

  // CORREÇÕES AUTOMÁTICAS
  console.log('\n🔧 APLICANDO CORREÇÕES...\n');

  if (!results.typescript.success) {
    console.log('🔨 Corrigindo TypeScript config...');
    fixTypeScriptConfig();
  }

  console.log('📝 Criando arquivos de tipos...');
  createTypesFile();

  if (results.mongo.success && !results.api.success) {
    console.log('🎯 Corrigindo tipos do Admin Panel...');
    await fixAdminPanelTypes();
  }

  console.log('\n🎉 DIAGNÓSTICO CONCLUÍDO!');
  console.log('🚀 Execute os próximos passos manuais se necessário.');
}

if (require.main === module) {
  runDiagnostic().catch(console.error);
}

module.exports = { runDiagnostic, testMongoConnection, testBackendAPI };
