const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, get, run, transaction } = require('../config/db');
const { ApiError } = require('../middleware/error');
require('dotenv').config();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
    const { email, password, firstName, lastName, role = 'student', department } = req.body;

    try {
        // Validate input
        if (!email || !password || !firstName || !lastName) {
            throw new ApiError(400, 'Please provide all required fields');
        }

        // Check if email is from cs.unza.zm domain
        if (!email.endsWith('@cs.unza.zm')) {
            throw new ApiError(400, 'Only @cs.unza.zm email addresses are allowed');
        }

        // Check if user already exists
        const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            throw new ApiError(400, 'User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userId = `user_${Date.now()}`;
        const result = await run(
            'INSERT INTO users (user_id, email, password_hash, first_name, last_name, role, department, is_first_login) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
            [userId, email, hashedPassword, firstName, lastName, role, department]
        );

        // Generate token
        const token = generateToken(userId);

        // Get the created user (without password)
        const user = await get(
            'SELECT user_id, email, first_name, last_name, role, department FROM users WHERE user_id = ?',
            [userId]
        );

        res.status(201).json({
            success: true,
            token,
            user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            throw new ApiError(400, 'Please provide email and password');
        }

        // Get user from database
        const user = await get('SELECT * FROM users WHERE email = ?', [email]);
        
        // Check if user exists
        if (!user) {
            throw new ApiError(401, 'Invalid credentials');
        }

        // Check if account is locked
        if (user.login_attempts >= process.env.MAX_LOGIN_ATTEMPTS) {
            const lastAttempt = new Date(user.last_login_attempt);
            const lockoutTime = new Date(lastAttempt.getTime() + (process.env.ACCOUNT_LOCKOUT_MINUTES * 60 * 1000));
            
            if (new Date() < lockoutTime) {
                throw new ApiError(403, `Account locked. Try again after ${lockoutTime.toLocaleTimeString()}`);
            } else {
                // Reset login attempts after lockout period
                await run(
                    'UPDATE users SET login_attempts = 0 WHERE user_id = ?',
                    [user.user_id]
                );
            }
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            // Increment login attempts
            await run(
                'UPDATE users SET login_attempts = login_attempts + 1, last_login_attempt = CURRENT_TIMESTAMP WHERE user_id = ?',
                [user.user_id]
            );
            
            throw new ApiError(401, 'Invalid credentials');
        }

        // Check if password needs to be changed
        if (user.is_first_login) {
            return res.status(200).json({
                success: true,
                requiresPasswordChange: true,
                userId: user.user_id
            });
        }

        // Reset login attempts on successful login
        await run(
            'UPDATE users SET login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.user_id]
        );

        // Generate token
        const token = generateToken(user.user_id);

        // Remove password from response
        const { password_hash, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.user_id;

    try {
        if (!currentPassword || !newPassword) {
            throw new ApiError(400, 'Please provide current and new password');
        }

        // Get user from database
        const user = await get('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch && !user.is_first_login) {
            throw new ApiError(400, 'Current password is incorrect');
        }

        // Check if new password is different from current
        if (await bcrypt.compare(newPassword, user.password_hash)) {
            throw new ApiError(400, 'New password must be different from current password');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await run(
            'UPDATE users SET password_hash = ?, is_first_login = 0, password_changed_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [hashedPassword, userId]
        );

        // Generate new token
        const token = generateToken(userId);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            token
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Public
const getMe = async (req, res, next) => {
    try {
        // Return a default public user
        const publicUser = {
            user_id: 'public_user',
            email: 'public@example.com',
            first_name: 'Public',
            last_name: 'User',
            role: 'admin',
            is_active: true,
            is_first_login: false,
            created_at: new Date().toISOString()
        };

        res.status(200).json({
            success: true,
            data: publicUser
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    changePassword,
    getMe
};
