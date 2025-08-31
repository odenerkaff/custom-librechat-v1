require('dotenv').config();

const mongoose = require('mongoose');

// Usar os mesmos modelos do LibreChat
const { createModels } = require('./packages/data-schemas/src/models');
const models = createModels(mongoose);
const { User } = models;

console.log('🔍 VERIFICANDO CONEXÃO COM BANCO DE DADOS...\n');

async function checkDatabase() {
  try {
    console.log('1. Conectando ao MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Presente' : 'Ausente');

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Connected!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('');

    // Verificar se há usuários
    console.log('2. Buscando usuários...');
    const users = await User.find({}).select('name email role _id createdAt').limit(10);
    console.log('Usuários encontrados:', users.length);
    console.log('');

    if (users.length > 0) {
      console.log('✅ USUÁRIOS ENCONTRADOS:');
      users.forEach((user, i) => {
        console.log(`${i+1}. ${user.name || 'Sem nome'} (${user.role || 'USER'}) - ${user.email || 'Sem email'}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Criado em: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ NENHUM USUÁRIO ENCONTRADO!');
      console.log('💡 Talvez seja necessário criar o primeiro usuário admin.');
      console.log('Sugestão: Rode o comando de criação de usuário.');
      console.log('');
    }

    // Verificar estatísticas
    console.log('3. Estatísticas gerais...');
    const totalUsers = await User.countDocuments({});
    const adminUsers = await User.countDocuments({ role: 'ADMIN' });
    const regularUsers = await User.countDocuments({ role: { $ne: 'ADMIN' } });

    console.log(`Total de usuários: ${totalUsers}`);
    console.log(`Admins: ${adminUsers}`);
    console.log(`Usuários regulares: ${regularUsers}`);
    console.log('');

    // Verificar coleção User
    console.log('4. Verificando coleção no MongoDB...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollection = collections.find(col => col.name === 'users');
    console.log('Coleção "users" existe:', !!userCollection);

    if (userCollection) {
      const stats = await mongoose.connection.db.collection('users').stats();
      console.log('Documentos na coleção:', stats.count);
      console.log('Tamanho da coleção:', stats.size, 'bytes');
    }

    console.log('');
    await mongoose.disconnect();
    console.log('✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ ERRO NA VERIFICAÇÃO:');
    console.error('Mensagem:', error.message);
    console.error('Nome:', error.name);

    if (error.code) console.error('Código:', error.code);
    if (error.codeName) console.error('Nome do código:', error.codeName);

    // Verificar URL do MongoDB
    console.log('');
    console.log('🔧 DIAGNÓSTICO MONGO_URI:');
    if (process.env.MONGO_URI) {
      const url = new URL(process.env.MONGO_URI);
      console.log('Host:', url.hostname);
      console.log('Port:', url.port || '27017 (default)');
      console.log('Database:', url.pathname.slice(1));
    } else {
      console.log('❌ MONGO_URI não definido!');
    }
  }
}

checkDatabase();
