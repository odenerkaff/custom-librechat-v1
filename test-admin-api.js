require('dotenv').config();
const axios = require('axios');

// Test Admin API with JWT
async function testAdminAPI() {
  try {
    console.log('🧪 Testing Admin API com Headers...\n');

    // Primeiro, vamos fazer requisição sem auth para ver o erro
    console.log('1. Testing GET /api/admin/users (sem auth)...');

    try {
      const response = await axios.get('http://localhost:3090/api/admin/users');
      console.log('✅ Requisição sem auth funcionou:', response.status);
    } catch (noAuthError) {
      console.log('❌ Sem auth - Status:', noAuthError.response?.status || 'Unknown');
      console.log('   Motivo:', noAuthError.response?.statusText || noAuthError.message);
    }

    // Agora vamos tentar fazer login primeiro
    console.log('\n2. Tentando fazer login para obter JWT...');

    try {
      // Usando as credenciais atualizadas
      const loginResponse = await axios.post('http://localhost:3090/api/auth/login', {
        email: 'deneralves@kaffco.com.br',
        password: 'admin123456' // Senha corrigida no banco
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login realizado com sucesso!');
      console.log('Token obtido:', loginResponse.data.token ? 'Sim' : 'Não');

      // Agora testar a API admin com JWT
      if (loginResponse.data.token) {
        console.log('\n3. Testing GET /api/admin/users (com JWT)...');

        const adminResponse = await axios.get('http://localhost:3090/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ SUCCESS: Users retrieved with JWT');
        console.log('👥 Total users:', adminResponse.data.length);
        if (adminResponse.data.length > 0) {
          adminResponse.data.slice(0, 3).forEach((user, i) => {
            console.log(`${i+1}. ${user.name} (${user.role}) - ${user.email}`);
          });
          if (adminResponse.data.length > 3) {
            console.log(`... e ${adminResponse.data.length - 3} mais usuários`);
          }
        }
      }

    } catch (loginError) {
      console.log('❌ Falha no login - Status:', loginError.response?.status || 'Unknown');
      console.log('   Dados:', loginError.response?.data || loginError.message);

      if (loginError.response?.status === 404) {
        console.log('\n💡 Possível problema:');
        console.log('   - Usuário admin pode não existir');
        console.log('   - Endpoint de login pode ter caminho diferente');
        console.log('   - Servidor pode não estar rodando');
      }
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAdminAPI();
