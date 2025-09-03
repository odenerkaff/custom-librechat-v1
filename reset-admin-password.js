require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modelo básico do usuário
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  provider: String,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function resetAdminPassword() {
  try {
    console.log('🔑 RESETANDO SENHA DO ADMIN...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    // Procurar usuário admin
    const adminUser = await User.findOne({ email: 'deneralves@kaffco.com.br' });

    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    console.log(`👤 Usuário encontrado: ${adminUser.name} (${adminUser.email})`);

    // Nova senha segura
    const newPassword = 'admin123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('✅ SENHA RESETADA COM SUCESSO!');
    console.log('🔐 Novas credenciais:');
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   🔑 Senha: ${newPassword}`);
    console.log(`   🏆 Role: ${adminUser.role}`);
    console.log('\n💡 Agora você pode fazer login com essas credenciais!');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ ERRO ao resetar senha:', error.message);
  }
}

resetAdminPassword();
