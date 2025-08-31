require('dotenv').config();
const mongoose = require('mongoose');

// Usar os mesmos modelos do LibreChat
const { createModels } = require('./packages/data-schemas/src/models');
const models = createModels(mongoose);
const { User } = models;

console.log('MONGO_URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(async() => {
    console.log('Conectado com sucesso!');

    const users = await User.find({}).select('name email role').lean();
    console.log('Total de usuários:', users.length);

    if (users.length > 0) {
      console.log('Primeiros usuários:');
      users.slice(0, 5).forEach((u, i) => {
        console.log(`${i+1}. Nome: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
      });
    }

    await mongoose.disconnect();
    console.log('Conexão fechada');
  })
  .catch(e => console.log('Erro:', e.message))
  .finally(() => process.exit());
