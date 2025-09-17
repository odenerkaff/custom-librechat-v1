console.log('[ADMIN API] AdminController loaded successfully');

const mongoose = require('mongoose');

// Import models using the createModels function from @librechat/data-schemas
let models;
try {
  const { createModels } = require('@librechat/data-schemas');
  models = createModels(mongoose);
  console.log('[ADMIN API] Models loaded from @librechat/data-schemas');
} catch (error) {
  console.error('[ADMIN API] CRITICAL ERROR: Cannot create models!');
  console.error('[ADMIN API] Error:', error.message);
  throw new Error('Failed to create models');
}

// Extract individual models
const { User, Balance, Referral } = models;

// Check if User is properly imported
if (!User || typeof User.find !== 'function') {
  console.error('[ADMIN API] USER MODEL INVALID - User.find is not a function');
  console.error('[ADMIN API] User object:', User);
  throw new Error('User model validation failed');
} else {
  console.log('[ADMIN API] User model validated successfully');
}

const { updateUser, deleteUserById } = require('~/models');
const { validatePassword, hashPassword } = require('~/server/services/AuthService');

// Import logger - fallback to console if winston fails
let logger;
try {
  logger = require('~/config/winston') || { error: console.error, info: console.log };
} catch (error) {
  logger = { error: console.error, info: console.log };
}

console.log('[ADMIN API] All imports completed');

const ONLINE_THRESHOLD_MINUTES = 5;
const ONLINE_THRESHOLD_MS = ONLINE_THRESHOLD_MINUTES * 60 * 1000;

// List all users for admin panel
const listUsersController = async (req, res) => {
  try {
    console.log('[ADMIN API] Starting request for user:', req.user?.email || 'unknown');
    console.log('[ADMIN API] Auth header:', req.headers.authorization ? 'PRESENT' : 'MISSING');
    console.log('[ADMIN API] User object:', !!req.user);
    console.log('[ADMIN API] User ID from req.user:', req.user?._id);

    // Check if we're connected to MongoDB
    console.log('[ADMIN API] Checking MongoDB connection...');
    console.log('[ADMIN API] Mongoose ready state:', mongoose.connection.readyState);

    if (mongoose.connection.readyState !== 1) {
      console.error('[ADMIN API] MongoDB is not connected!');
      return res.status(500).json({
        message: 'Database connection failed',
        error: 'MongoDB not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Simple query for users
    console.log('[ADMIN API] Executing MongoDB query...');
    const users = await User.find({}, '-password -totpSecret -backupCodes')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('[ADMIN API DEBUG] MongoDB query successful, found:', users.length);
    console.log('[ADMIN API DEBUG] First user sample:', users[0]?.email || 'No users found');

    // Load balance and referral info for each user
    console.log('[ADMIN API] Loading balance and referral info for each user...');
    const usersWithBalance = await Promise.all(
      users.map(async (user) => {
        try {
          // Get balance directly from Balance model
          const balanceRecord = await Balance.findOne({ user: user._id }).lean();
          const balance = balanceRecord?.tokenCredits || 0;

          // Check if user was referred (has a referral record as referredUser)
          let source = 'Outros';
          if (Referral) {
            const referralRecord = await Referral.findOne({ referredUser: user._id }).lean();
            if (referralRecord) {
              source = 'Indicacao';
            }
          }

          const activitySource = user.lastActive || user.updatedAt || user.createdAt;
          const lastActivityDate = activitySource ? new Date(activitySource) : null;
          const lastActivityIso = lastActivityDate ? lastActivityDate.toISOString() : null;
          const isOnline = lastActivityDate ? Date.now() - lastActivityDate.getTime() <= ONLINE_THRESHOLD_MS : false;

          console.log(`[ADMIN API] User ${user.name} (${user.email}) balance: ${balance}, source: ${source}, lastActivity: ${lastActivityIso ?? 'N/A'}, online: ${isOnline}`);

          return {
            id: user._id,
            name: user.name || 'Sem nome',
            email: user.email || 'Sem email',
            role: user.role || 'USER',
            createdAt: user.createdAt,
            lastActivity: lastActivityIso,
            isOnline,
            balance: balance,
            source: source,
            provider: user.provider || 'local',
            avatar: user.avatar,
            emailVerified: user.emailVerified || false
          };
        } catch (error) {
          console.error(`[ADMIN API] Error loading data for user ${user.name}:`, error);
          const fallbackActivity = user.updatedAt ? new Date(user.updatedAt).toISOString() : null;
          return {
            id: user._id,
            name: user.name || 'Sem nome',
            email: user.email || 'Sem email',
            role: user.role || 'USER',
            createdAt: user.createdAt,
            lastActivity: fallbackActivity,
            isOnline: false,
            balance: 0, // Fallback to 0 if balance loading fails
            source: 'Outros', // Fallback to 'Outros' if referral check fails
            provider: user.provider || 'local',
            avatar: user.avatar,
            emailVerified: user.emailVerified || false
          };
        }
      })
    );

    console.log('[ADMIN API] Returning', usersWithBalance.length, 'users with balance data');
    console.log('[ADMIN API] Balance summary:', usersWithBalance.map(u => `${u.name}: ${u.balance}`).join(', '));

    res.status(200).send(usersWithBalance);
  } catch (error) {
    console.error('[ADMIN API] Error captured in catch block:', error);
    console.error('[ADMIN API] Error message:', error.message);
    console.error('[ADMIN API] Error name:', error.name);
    console.error('[ADMIN API] Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to retrieve users',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Create new user for admin
const createUserController = async (req, res) => {
  try {
    console.log('CreateUserController called with:', req.body);

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // SIMPLE approach for debugging
    try {
      const hashedPassword = await hashPassword(password || 'temp123456');
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || 'USER',
        provider: 'local'
      });

      console.log('Saving user:', {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      });

      const savedUser = await newUser.save();
      console.log('User saved successfully:', savedUser._id);

      // Create initial balance for new user
      try {
        console.log('[ADMIN API] Creating initial balance for new user...');

        // Use default balance configuration from librechat.yaml
        const startBalance = 20000; // You can make this configurable later

        const newBalance = new Balance({
          user: savedUser._id,
          tokenCredits: startBalance,
          context: 'initial-admin-creation',
          autoRefillEnabled: true,
          refillIntervalValue: 1,
          refillIntervalUnit: 'days',
          refillAmount: 10000
        });

        await newBalance.save();
        console.log('[ADMIN API] Initial balance created:', startBalance, 'credits for user', savedUser.name);

      } catch (balanceError) {
        console.error('[ADMIN API] Error creating initial balance:', balanceError);
        // Continue with user creation even if balance creation fails
        console.log('[ADMIN API] User created successfully even with balance error');
      }

      res.status(201).json({
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        balance: startBalance, // Return the initial balance
        createdAt: savedUser.createdAt
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({
        message: 'Database error',
        error: dbError.message
      });
    }

  } catch (error) {
    console.error('[createUserController] Error:', error);
    res.status(500).json({
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user for admin
const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, balance, credits, tokenCredits } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const updateData = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (typeof email === "string" && email.trim()) updateData.email = email.trim().toLowerCase();
    if (typeof role === "string" && role.trim()) updateData.role = role.trim();

    let updatedUser;
    if (Object.keys(updateData).length > 0) {
      updatedUser = await updateUser(id, updateData);
    } else {
      updatedUser = await User.findById(id, "-password -totpSecret -backupCodes");
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balancePayload = balance ?? credits ?? tokenCredits;
    let balanceRecord = null;

    if (balancePayload !== undefined) {
      const parsedBalance = Number(balancePayload);
      if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
        return res.status(400).json({ message: 'Invalid balance value' });
      }

      balanceRecord = await Balance.findOneAndUpdate(
        { user: updatedUser._id },
        {
          $set: { tokenCredits: parsedBalance },
          $setOnInsert: { user: updatedUser._id },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
    } else {
      balanceRecord = await Balance.findOne({ user: updatedUser._id }).lean();
    }

    res.status(200).send({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      balance: balanceRecord?.tokenCredits || 0,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    logger.error('[updateUserController]', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user for admin
const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteUserById(id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('[deleteUserController]', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get user details for admin
const getUserDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, '-password -totpSecret -backupCodes');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get balance directly from Balance model
    const balanceRecord = await Balance.findOne({ user: user._id }).lean();
    const activitySource = user.lastActive || user.updatedAt || user.createdAt;
    const lastActivityDate = activitySource ? new Date(activitySource) : null;
    const lastActivity = lastActivityDate ? lastActivityDate.toISOString() : null;
    const isOnline = lastActivityDate ? Date.now() - lastActivityDate.getTime() <= ONLINE_THRESHOLD_MS : false;

    res.status(200).send({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActivity,
      isOnline,
      balance: balanceRecord?.tokenCredits || 0,
      provider: user.provider,
      avatar: user.avatar,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    logger.error('[getUserDetailsController]', error);
    res.status(500).json({ message: 'Failed to get user details' });
  }
};

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

// Create multiple random users for testing
const createRandomUsersController = async (req, res) => {
  try {
    const { count = 20 } = req.body;
    const maxUsers = Math.min(parseInt(count) || 20, 50); // Limit to 50 users max

    console.log(`[ADMIN API] Creating ${maxUsers} random users for testing...`);

    const usersToCreate = [];
    const maxAttempts = 100; // Prevent infinite loops

    // Generate unique users
    for (let i = 0; i < maxUsers && usersToCreate.length < maxUsers; i++) {
      let attempts = 0;
      let userGenerated = false;

      while (!userGenerated && attempts < maxAttempts) {
        const userData = generateRandomUser();

        // Check if user already exists
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
        console.warn(`[ADMIN API] Could not generate unique user after ${maxAttempts} attempts`);
      }
    }

    console.log(`[ADMIN API] Generated ${usersToCreate.length} unique users`);

    const createdUsers = [];
    const failedUsers = [];

    // Create users one by one
    for (const userData of usersToCreate) {
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
          console.error(`[ADMIN API] Failed to create user ${userData.email}:`, result.message);
          failedUsers.push({ ...userData, error: result.message });
        } else {
          console.log(`[ADMIN API] ✅ Created user: ${userData.name} (${userData.email})`);
          createdUsers.push({
            name: userData.name,
            email: userData.email,
            password: userData.password // Include password for reference
          });
        }
      } catch (error) {
        console.error(`[ADMIN API] Error creating user ${userData.email}:`, error.message);
        failedUsers.push({ ...userData, error: error.message });
      }
    }

    const response = {
      success: true,
      message: `Criados ${createdUsers.length} usuários aleatórios com sucesso`,
      created: createdUsers.length,
      failed: failedUsers.length,
      users: createdUsers,
      failures: failedUsers.length > 0 ? failedUsers : undefined
    };

    console.log(`[ADMIN API] ✅ Operation completed: ${createdUsers.length} created, ${failedUsers.length} failed`);

    res.status(200).json(response);

  } catch (error) {
    console.error('[ADMIN API] Error in createRandomUsersController:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuários aleatórios',
      error: error.message
    });
  }
};

module.exports = {
  listUsersController,
  createUserController,
  createRandomUsersController,
  updateUserController,
  deleteUserController,
  getUserDetailsController
};
