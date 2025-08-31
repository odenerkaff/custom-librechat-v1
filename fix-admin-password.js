require('dotenv').config();

// Script para corrigir senha do usuário admin no MongoDB
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function fixAdminPassword() {
  console.log('🔧 Corrigindo senha do usuário admin...\n');

  const uri = process.env.MONGO_URI || "mongodb+srv://deneralves_db_user:MuGk1vdM93QjFkqh@db-dev-librechat.j3nnwlv.mongodb.net/librechat?retryWrites=true&w=majority&appName=db-dev-librechat";

  console.log('📍 Conectando ao MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB!\n');

    const db = client.db();

    // Procurar usuário admin
    console.log('👤 Procurando usuário admin existente...');
    const adminUser = await db.collection('users').findOne({
      email: 'deneralves@kaffco.com.br'
    });

    if (adminUser) {
      console.log('✅ Usuário encontrado:', adminUser.name);
      console.log('📧 Email:', adminUser.email);
      console.log('👑 Role:', adminUser.role);

      // Criar nova senha hash
      const newPassword = 'admin123456';
      console.log('\n🔐 Criando nova senha: admin123456');

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha no banco
      const result = await db.collection('users').updateOne(
        { email: 'deneralves@kaffco.com.br' },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log('✅ Senha atualizada com sucesso!');
        console.log('🔑 Nova senha: admin123456');
      } else {
        console.log('⚠️ Falha ao atualizar senha');
      }

    } else {
      console.log('❌ Usuário admin não encontrado!');
    }

    await client.close();

  } catch (error) {
    console.error('❌ Erro ao conectar/corrigir senha:');
    console.error('Mensagem:', error.message);
  }
}

fixAdminPassword();
