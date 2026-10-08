// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// ============================================================
// STRICT — Only for login/register (prevents brute-force attacks)
// 10 attempts per 15 minutes per IP
// ============================================================
exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`🚨 Login rate limit hit: ${req.ip}`);
        res.status(429).json({
            message: 'Too many login attempts. Please try again after 15 minutes.'
        });
    },
    skipSuccessfulRequests: true
});

// ============================================================
// LIGHT — Global rate limiter for API usage
// 5000 requests per 15 minutes per IP
// Skips authenticated users entirely (they already passed login)
// ============================================================
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: { message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Authenticated users skip this limiter entirely
        if (req.cookies?.nf_token) return true;
        if (req.headers.authorization?.startsWith('Bearer ')) return true;
        return false;
    }
});

// ============================================================
// MODERATE — Public unauthenticated reads
// ============================================================
exports.readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================================
// VERY STRICT — Password reset
// ============================================================
exports.passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { message: 'Too many password reset attempts. Try again in 1 hour.' }
});