// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// ===== STRICT — For login/register =====
// 5 attempts per 15 minutes
exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Log the IP that hit the limit
    handler: (req, res) => {
        console.warn(`🚨 Rate limit hit: ${req.ip} on ${req.path}`);
        res.status(429).json({
            message: 'Too many login attempts. Please try again after 15 minutes.'
        });
    },
    // Skip successful attempts (only count failures)
    skipSuccessfulRequests: true
});

// ===== MODERATE — For general API =====
// 100 requests per 15 minutes
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ===== LENIENT — For read-only endpoints =====
// 300 requests per 15 minutes
exports.readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ===== PASSWORD RESET — Very strict =====
exports.passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { message: 'Too many password reset attempts. Try again in 1 hour.' }
});