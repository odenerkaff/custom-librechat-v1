const express = require('express');
const { checkAdmin, requireJwtAuth } = require('~/server/middleware');
const {
  listUsersController,
  createUserController,
  updateUserController,
  deleteUserController,
  getUserDetailsController
} = require('~/server/controllers/AdminController');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(requireJwtAuth);  // First: authenticate the user
router.use(checkAdmin);      // Then: verify admin role

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
