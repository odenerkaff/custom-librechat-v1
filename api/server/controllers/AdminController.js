console.log('[ADMIN API] AdminController loaded successfully');

const mongoose = require('mongoose');
const {
  User,
  Balance,
  updateUser,
  deleteUserById,
} = require('~/models');
const { validatePassword, hashPassword } = require('~/server/services/AuthService');

console.log('[ADMIN API] All imports completed');

// List all users for admin panel
const listUsersController = async (req, res) => {
  try {
    console.log('[ADMIN API] Starting listUsersController...');
    console.log('[ADMIN API] User from request:', req.user ? req.user.email : 'No user');
    console.log('[ADMIN API] User role:', req.user ? req.user.role : 'No role');

    // Debug more details
    console.log('[ADMIN API] Request headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'user-agent': req.headers['user-agent']
    });
    console.log('[ADMIN API] Request cookies:', req.cookies);

    // Simple query first to test
    const users = await User.find({}, '-password -totpSecret -backupCodes')
      .sort({ createdAt: -1 });

    console.log('[ADMIN API] Found users:', users.length);

    const usersWithBalance = users.map(user => ({
      id: user._id,
      name: user.name || 'Sem nome',
      email: user.email || 'Sem email',
      role: user.role || 'USER',
      createdAt: user.createdAt,
      lastActivity: user.updatedAt,
      balance: 0, // Will implement balance later
      provider: user.provider || 'local',
      avatar: user.avatar,
      emailVerified: user.emailVerified || false
    }));

    console.log('Returning users:', usersWithBalance.length);
    res.status(200).send(usersWithBalance);
  } catch (error) {
    console.error('[listUsersController] Error:', error);
    res.status(500).json({
      message: 'Failed to retrieve users',
      error: error.message
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

      res.status(201).json({
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
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
