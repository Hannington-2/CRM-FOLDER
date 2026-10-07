// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getMe,
    refreshCsrf
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/csrf', refreshCsrf);   // ← Public CSRF refresher

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

module.exports = router;