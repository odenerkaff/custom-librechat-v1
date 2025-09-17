const path = require('path');
const mongoose = require('mongoose');
const { User } = require('@librechat/data-schemas').createModels(mongoose);
require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const { registerUser } = require('~/server/services/AuthService');
const connect = require('./connect');

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
    username: email.split('@')[0]
  };
}

async function createUser(userData) {
  try {
    const user = {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      username: userData.username,
      confirm_password: userData.password
    };

    const result = await registerUser(user, { emailVerified: true });

    if (result.status !== 200) {
      console.red(`❌ Erro ao criar usuário ${userData.email}: ${result.message}`);
      return false;
    }

    console.green(`✅ Usuário criado: ${userData.name} (${userData.email})`);
    return true;
  } catch (error) {
    console.red(`❌ Erro ao criar usuário ${userData.email}: ${error.message}`);
    return false;
  }
}

(async () => {
  await connect();

  console.purple('🎯 CRIANDO 20 USUÁRIOS ALEATÓRIOS PARA TESTE');
  console.purple('================================================');

  const usersToCreate = [];
  const maxAttempts = 50; // Para evitar loop infinito se gerar emails duplicados

  // Gerar 20 usuários únicos
  for (let i = 0; i < 20 && usersToCreate.length < 20; i++) {
    let attempts = 0;
    let userGenerated = false;

    while (!userGenerated && attempts < maxAttempts) {
      const userData = generateRandomUser();

      // Verificar se já existe
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
      });

      if (!existingUser) {
        usersToCreate.push(userData);
        userGenerated = true;
      }

      attempts++;
    }

    if (!userGenerated) {
      console.orange(`⚠️  Não foi possível gerar usuário único após ${maxAttempts} tentativas`);
    }
  }

  console.blue(`📝 Criando ${usersToCreate.length} usuários...`);

  let successCount = 0;
  let failCount = 0;

  for (const userData of usersToCreate) {
    const success = await createUser(userData);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.purple('================================================');
  console.green(`✅ ${successCount} usuários criados com sucesso!`);
  if (failCount > 0) {
    console.red(`❌ ${failCount} usuários falharam.`);
  }
  console.blue('🎉 Processo concluído!');
  console.blue('💡 Você pode fazer login com qualquer um dos usuários criados.');

  process.exit(0);
})();

process.on('uncaughtException', (err) => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});
