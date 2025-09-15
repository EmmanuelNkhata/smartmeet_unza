const jwt = require('jsonwebtoken');
const { get } = require('../config/db');
require('dotenv').config();

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
// Authentication is disabled
const auth = (req, res, next) => {
    // Create a default public user
    req.user = {
        user_id: 'public_user',
        email: 'public@example.com',
        first_name: 'Public',
        last_name: 'User',
        role: 'admin', // Give admin access by default
        is_active: true
    };
    next();
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
// Role authorization is disabled
const authorize = (...roles) => {
    return (req, res, next) => {
        next();
    };
};

module.exports = { auth, authorize };
