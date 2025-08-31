const express = require('express');
const { checkAdmin } = require('~/server/middleware');
const {
  listUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  getUserDetailsController
} = require('~/server/controllers/AdminController');

const router = express.Router();

// All admin routes require admin privileges
router.use(checkAdmin);

// List all users
router.get('/users', listUsersController);

// Create new user
router.post('/users', createUserController);

// Get user details
router.get('/users/:id', getUserDetailsController);

// Update user
router.put('/users/:id', updateUserController);

// Delete user
router.delete('/users/:id', deleteUserController);

module.exports = router;
