require('dotenv').config();

// Tentativa mais simples usando MongoDB nativo
const { MongoClient } = require('mongodb');

async function checkMongoDirectly() {
  console.log('🔍 Verificando conexão MongoDB diretamente...\n');

  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB!');

    const db = client.db();
    console.log('Banco de dados:', db.databaseName);

    // Listar coleções
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Coleções encontradas:');
    collections.forEach((col, i) => {
      console.log(`${i + 1}. ${col.name}`);
    });

    // Verificar se existe coleção 'users'
    const usersCollection = collections.find(c => c.name === 'users');
    if (usersCollection) {
      console.log('\n👥 Verificando coleção "users"...');

      // Contar documentos
      const userCount = await db.collection('users').countDocuments();
      console.log(`Total de usuários na base: ${userCount}`);

      if (userCount > 0) {
        // Pegar alguns usuários de exemplo
        const sampleUsers = await db.collection('users')
          .find({})
          .project({ name: 1, email: 1, role: 1, createdAt: 1 })
          .limit(3)
          .toArray();

        console.log('\n👤 Exemplos de usuários:');
        sampleUsers.forEach((user, i) => {
          console.log(`${i + 1}. ${user.name || 'Sem nome'} (${user.role || 'USER'}) - ${user.email || 'Sem email'}`);
        });
      } else {
        console.log('❌ Nenhum usuário encontrado!');
        console.log('💡 Você pode precisar criar usuarios via UI ou comando create-user');
      }

    } else {
      console.log('❌ Coleção "users" não encontrada!');
    }

    await client.close();
    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro na conexão:');
    console.error('Mensagem:', error.message);
    if (error.code) console.error('Código:', error.code);
    if (error.codeName) console.error('Nome do código:', error.codeName);
  }
}

checkMongoDirectly();
