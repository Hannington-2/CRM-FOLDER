// backend/src/middleware/csrf.js
const crypto = require('crypto');

const CSRF_COOKIE_NAME = 'nf_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Helper to get consistent cookie settings
const getCsrfCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    return {
        httpOnly: false,        // Must be readable by JS to send back in header
        secure: isProd,         // Requires HTTPS in production
        sameSite: isProd ? 'none' : 'lax', // 'none' allows cross-site cookie sending
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
    };
};

/**
 * Generate a CSRF token and set it as a cookie.
 * Called on login and on app init.
 */
exports.issueCsrfToken = (req, res, next) => {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
    res.setHeader('X-CSRF-Token', token);
    next();
};

/**
 * Verify the CSRF token on state-changing requests.
 * Skips GET, HEAD, OPTIONS.
 */
exports.verifyCsrf = (req, res, next) => {
    // 1. Skip safe methods (Browser preflight OPTIONS will pass through here)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // 2. Skip auth routes.
    // Note: Because this middleware is mounted on '/api', 
    // Express strips '/api' from req.path (e.g., it becomes '/auth/login')
    if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register')) {
        return next();
    }

    // 3. Validate tokens for all other state-changing routes
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken) {
        return res.status(403).json({ message: 'CSRF token missing' });
    }

    // Constant-time comparison to prevent timing attacks
    try {
        const a = Buffer.from(cookieToken);
        const b = Buffer.from(headerToken);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return res.status(403).json({ message: 'CSRF token invalid' });
        }
    } catch {
        return res.status(403).json({ message: 'CSRF token invalid' });
    }

    next();
};

exports.CSRF_COOKIE_NAME = CSRF_COOKIE_NAME;
exports.CSRF_HEADER_NAME = CSRF_HEADER_NAME;