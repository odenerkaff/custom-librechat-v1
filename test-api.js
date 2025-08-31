require('dotenv').config();

const mongoose = require('mongoose');

// Usar os mesmos modelos do LibreChat
const { createModels } = require('./packages/data-schemas/src/models');
const models = createModels(mongoose);
const { User, Balance } = models;

console.log('🔍 TESTANDO API ADMIN ABADIR INTERNAMENTE...\n');

async function testAdminAPI() {
  try {
    console.log('1._test mongoose connection...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected!\n');

    // 2. Test basic User.find()
    console.log('2. Test basic User.find() query...');
    const allUsers = await User.find({}).select('name email role _id').limit(5);
    console.log('✅ Basic User.query worked:');
    console.log('Total users found:', allUsers.length);
    allUsers.forEach((u, i) => {
      console.log(`${i+1}. ${u.name} (${u.role}) - ${u.email}`);
    });
    console.log('');

    // 3. Test the actual query from AdminController
    console.log('3. Test exact AdminController query...');
    const users = await User.find({}, '-password -totpSecret -backupCodes')
      .sort({ createdAt: -1 });

    console.log('✅ AdminController query worked:');
    console.log('Users found:', users.length);

    const usersWithBalance = users.map(user => ({
      id: user._id,
      name: user.name || 'Sem nome',
      email: user.email || 'Sem email',
      role: user.role || 'USER',
      createdAt: user.createdAt,
      lastActivity: user.updatedAt,
      balance: 0,
      provider: user.provider || 'local',
      avatar: user.avatar,
      emailVerified: user.emailVerified || false
    }));

    console.log('✅ Users mapped successfully:', usersWithBalance.length);
    usersWithBalance.forEach((u, i) => {
      console.log(`${i+1}. ${u.name} (${u.role}) - ${u.email}`);
    });
    console.log('');

    // 4. Test create user
    console.log('4. Test create user operation...');
    const testUser = {
      name: 'Test API User',
      email: `test-api-${Date.now()}@test.com`,
      role: 'USER',
      provider: 'local'
    };

    const hashedPassword = 'temp123456'; // Simplified for test
    testUser.password = hashedPassword;

    const newUser = new User(testUser);
    const savedUser = await newUser.save();
    console.log('✅ User creation worked:');
    console.log('ID:', savedUser._id);
    console.log('Name:', savedUser.name);
    console.log('Email:', savedUser.email);
    console.log('');

    await mongoose.disconnect();
    console.log('✅ All tests PASSED!');

  } catch (error) {
    console.error('❌ Error in test:', error);
    console.error('Stack:', error.stack);

    if (error.code) console.error('Error Code:', error.code);
    if (error.codeName) console.error('Error CodeName:', error.codeName);
    if (error.message) console.error('Error Message:', error.message);
  }
}

testAdminAPI();
