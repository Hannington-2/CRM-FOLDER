// backend/src/middleware/security.js
const helmet = require('helmet');

// ===== SECURITY HEADERS =====
// Protects against: XSS, clickjacking, MIME sniffing, etc.
exports.securityHeaders = helmet({
    contentSecurityPolicy: false, // Disabled for React dev — enable in production
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },   // Prevent clickjacking
    noSniff: true,                     // Prevent MIME type sniffing
    xssFilter: true,                   // Legacy XSS protection
    referrerPolicy: { policy: 'no-referrer' }
});

// ===== INPUT SANITIZATION =====
// Prevents NoSQL injection by stripping $ and . from keys
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        // Remove null bytes and control chars
        return value.replace(/\0/g, '').trim();
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
        const sanitized = {};
        for (const key of Object.keys(value)) {
            // Block MongoDB operators
            if (key.startsWith('$') || key.includes('.')) continue;
            sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
    }
    return value;
};

exports.sanitizeInput = (req, res, next) => {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.params) req.params = sanitizeValue(req.params);
    // Note: don't sanitize req.query — Express 5 uses read-only getters
    next();
};

// ===== ADDITIONAL HEADERS =====
exports.customHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
};