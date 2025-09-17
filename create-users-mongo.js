// Script para criar 20 usuários aleatórios diretamente no MongoDB
// Execute com: node create-users-mongo.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Conectar ao MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/librechat';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
}

// Definir schema do usuário (simplificado)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'USER' },
  provider: { type: String, default: 'local' },
  emailVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Dados para gerar usuários
const firstNames = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Mariana', 'Lucas', 'Julia', 'Fernando', 'Beatriz',
  'Gabriel', 'Camila', 'Rafael', 'Larissa', 'Diego', 'Amanda', 'Bruno', 'Carolina', 'Gustavo', 'Isabela',
  'Henrique', 'Sophia', 'Leonardo', 'Alice', 'Matheus', 'Laura', 'Felipe', 'Valentina', 'Vinicius', 'Helena'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Costa', 'Gomes', 'Martins',
  'Araujo', 'Melo', 'Barbosa', 'Ribeiro', 'Alves', 'Pereira', 'Lima', 'Carvalho', 'Teixeira', 'Moreira'
];

const domains = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'uol.com.br', 'bol.com.br', 'terra.com.br'
];

function generateRandomUser() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  const password = Math.random().toString(36).slice(-12) + 'Aa1!';

  return {
    name: fullName,
    email: email,
    password: password,
    role: 'USER',
    provider: 'local',
    emailVerified: true
  };
}

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function createUsers() {
  try {
    console.log('🚀 Iniciando criação de 20 usuários aleatórios no MongoDB...\n');

    const usersToCreate = [];
    const maxAttempts = 100;

    // Gerar 20 usuários únicos
    for (let i = 0; i < 20 && usersToCreate.length < 20; i++) {
      let attempts = 0;
      let userGenerated = false;

      while (!userGenerated && attempts < maxAttempts) {
        const userData = generateRandomUser();

        // Verificar se já existe
        const existingUser = await User.findOne({
          $or: [{ email: userData.email }]
        });

        if (!existingUser) {
          usersToCreate.push(userData);
          userGenerated = true;
        }

        attempts++;
      }

      if (!userGenerated) {
        console.warn(`⚠️ Não foi possível gerar usuário único após ${maxAttempts} tentativas`);
      }
    }

    console.log(`📝 Criando ${usersToCreate.length} usuários...\n`);

    const createdUsers = [];
    let successCount = 0;
    let failCount = 0;

    for (const userData of usersToCreate) {
      try {
        // Hash da senha
        const hashedPassword = await hashPassword(userData.password);

        const newUser = new User({
          ...userData,
          password: hashedPassword
        });

        const savedUser = await newUser.save();

        createdUsers.push({
          name: userData.name,
          email: userData.email,
          password: userData.password, // Senha original para referência
          _id: savedUser._id
        });

        console.log(`✅ ${userData.name} - ${userData.email}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Erro ao criar ${userData.name}: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n================================================`);
    console.log(`✅ ${successCount} usuários criados com sucesso!`);
    if (failCount > 0) {
      console.log(`❌ ${failCount} usuários falharam.`);
    }
    console.log(`================================================\n`);

    console.log('👥 Lista completa de usuários criados:');
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Senha: ${user.password}`);
      console.log(`   ID: ${user._id}\n`);
    });

    console.log('💡 Agora você pode fazer login com qualquer um desses usuários!');
    console.log('🔄 Reinicie o servidor e acesse o painel admin para ver os usuários.');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function main() {
  await connectDB();
  await createUsers();
  await mongoose.disconnect();
  console.log('✅ Conexão com MongoDB fechada');
  process.exit(0);
}

main().catch(console.error);
