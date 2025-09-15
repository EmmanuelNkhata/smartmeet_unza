const express = require('express');
const { check } = require('express-validator');
const { getMe, updateProfile, getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

// All routes are now public

// @route   GET /api/v1/users/me
// @desc    Get user profile
// @access  Public
router.get('/me', getMe);

// @route   PUT /api/v1/users/me
// @desc    Update current user profile
// @access  Private
router.put(
  '/me',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
  ],
  updateProfile
);

// @route   GET /api/v1/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authorize('admin'), getUsers);

// @route   GET /api/v1/users/:id
// @desc    Get user by ID (admin only)
// @access  Private/Admin
router.get('/:id', authorize('admin'), getUser);

// @route   PUT /api/v1/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put(
  '/:id',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('role', 'Please include a valid role').isIn(['admin', 'lecturer', 'student', 'staff']),
  ],
  authorize('admin'),
  updateUser
);

// @route   DELETE /api/v1/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
