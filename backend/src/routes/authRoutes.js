// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getMe,
    refreshCsrf,
    promoteMeToAdmin
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public routes — STRICT rate limiting (brute-force protection)
router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/csrf', refreshCsrf);

// Protected routes — NO strict limiter
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);
router.post('/promote-me', authMiddleware, promoteMeToAdmin);

module.exports = router;