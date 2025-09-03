require('dotenv').config();
const mongoose = require('mongoose');

// Conectar diretamente ao MongoDB
async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Buscar todos os usuários
    const users = await collection.find({}, {
      projection: { name: 1, email: 1, role: 1, provider: 1, createdAt: 1 }
    }).toArray();

    console.log(`👥 Total de usuários encontrados: ${users.length}\n`);

    if (users.length === 0) {
      console.log('⚠️ NENHUM USUÁRIO ENCONTRADO!');
      console.log('💡 Você precisa criar um usuário admin primeiro.');
      return;
    }

    // Mostrar usuários
    console.log('📋 USUÁRIOS NO SISTEMA:');
    console.log('='.repeat(60));

    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 Nome: ${user.name || 'Não definido'}`);
      console.log(`   📧 Email: ${user.email || 'Não definido'}`);
      console.log(`   🔒 Role: ${user.role || 'USER'}`);
      console.log(`   🏠 Provider: ${user.provider || 'local'}`);
      console.log(`   📅 Criado em: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Não definido'}`);
      console.log('-'.repeat(40));
    });

    // Contagem por role
    const admins = users.filter(u => u.role === 'ADMIN');
    console.log(`\n📊 ESTATÍSTICAS:`);
    console.log(`👨‍💼 Administradores: ${admins.length}`);
    console.log(`👥 Usuários normais: ${users.length - admins.length}`);

    if (admins.length === 0) {
      console.log('\n❌ ALERTA: Nenhum usuário com role ADMIN encontrado!');
      console.log('💡 Você precisa promover um usuário para ADMIN ou criar um novo.');
    }

    // Sugestões
    console.log('\n💡 PRÓXIMOS PASSOS:');

    if (admins.length === 0 && users.length > 0) {
      const user = users[0];
      console.log(`1. Para usar ${user.email}, você pode:`);
      console.log(`   - Definir uma senha padrão`);
      console.log(`   - Ou fazer login como este usuário e promover para ADMIN`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ ERRO ao verificar usuários:', error.message);
  }
}

checkUsers();
