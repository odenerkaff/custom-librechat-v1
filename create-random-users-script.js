// Script para criar 20 usuários aleatórios via API
// Execute este script no console do navegador quando estiver logado como admin

async function createRandomUsers() {
  try {
    console.log('🚀 Iniciando criação de 20 usuários aleatórios...');

    // Fazer a requisição para a API
    const response = await fetch('/api/admin/users/random', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // O token de autenticação será incluído automaticamente pelos cookies
      },
      credentials: 'include',
      body: JSON.stringify({
        count: 20
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SUCESSO! Usuários criados:');
      console.log(`📊 Total criados: ${result.created}`);
      console.log(`❌ Total com falha: ${result.failed}`);

      console.log('\n👥 Lista de usuários criados:');
      result.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.email} (Senha: ${user.password})`);
      });

      if (result.failures) {
        console.log('\n❌ Usuários que falharam:');
        result.failures.forEach((failure, index) => {
          console.log(`${index + 1}. ${failure.name} - ${failure.email}: ${failure.error}`);
        });
      }

      console.log('\n💡 Agora você pode fazer login com qualquer um desses usuários!');
      console.log('🔄 Atualize o painel admin para ver os novos usuários.');

    } else {
      console.error('❌ ERRO:', result.message || 'Erro desconhecido');
      if (result.error) {
        console.error('Detalhes:', result.error);
      }
    }

  } catch (error) {
    console.error('❌ ERRO na requisição:', error.message);
    console.log('💡 Certifique-se de que:');
    console.log('   - Você está logado como administrador');
    console.log('   - O servidor backend está rodando');
    console.log('   - Você tem permissões para acessar /api/admin/users/random');
  }
}

// Executar a função
createRandomUsers();
