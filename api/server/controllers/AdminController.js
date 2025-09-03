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
const { User, Balance } = models;

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

    // Load balance for each user
    console.log('[ADMIN API] Loading balance for each user...');
    const usersWithBalance = await Promise.all(
      users.map(async (user) => {
        try {
          // Get balance directly from Balance model
          const balanceRecord = await Balance.findOne({ user: user._id }).lean();
          const balance = balanceRecord?.tokenCredits || 0;

          console.log(`[ADMIN API] User ${user.name} (${user.email}) balance: ${balance}`);

          return {
            id: user._id,
            name: user.name || 'Sem nome',
            email: user.email || 'Sem email',
            role: user.role || 'USER',
            createdAt: user.createdAt,
            lastActivity: user.lastActive || user.updatedAt,
            balance: balance,
            provider: user.provider || 'local',
            avatar: user.avatar,
            emailVerified: user.emailVerified || false
          };
        } catch (error) {
          console.error(`[ADMIN API] Error loading balance for user ${user.name}:`, error);
          return {
            id: user._id,
            name: user.name || 'Sem nome',
            email: user.email || 'Sem email',
            role: user.role || 'USER',
            createdAt: user.createdAt,
            lastActivity: user.updatedAt,
            balance: 0, // Fallback to 0 if balance loading fails
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
    const { name, email, role } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;

    const updatedUser = await updateUser(id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).send({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt
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
    const lastActivity = user.lastActive ? user.lastActive : user.updatedAt;

    res.status(200).send({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActivity: lastActivity,
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

module.exports = {
  listUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  getUserDetailsController
};
