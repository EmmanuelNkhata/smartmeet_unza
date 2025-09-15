const express = require('express');
const { check } = require('express-validator');
const { register, login, changePassword } = require('../controllers/userController');

const router = express.Router();

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
  ],
  register
);

// @route   POST /api/v1/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  login
);

// @route   PUT /api/v1/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a new password with 8 or more characters').isLength({ min: 8 }),
  ],
  changePassword
);

module.exports = router;
