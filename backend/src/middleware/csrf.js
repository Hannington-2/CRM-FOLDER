// backend/src/middleware/csrf.js
const crypto = require('crypto');

const CSRF_COOKIE_NAME = 'nf_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token and set it as a cookie.
 * Called on login and on app init.
 */
exports.issueCsrfToken = (req, res, next) => {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');

    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,        // Must be readable by JS to send back in header
        secure: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true',
        sameSite: process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
    });

    res.setHeader('X-CSRF-Token', token);
    next();
};

/**
 * Verify the CSRF token on state-changing requests.
 * Skips GET, HEAD, OPTIONS.
 */
exports.verifyCsrf = (req, res, next) => {
    // Skip safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip auth routes — login/register don't have a token yet
    if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
        return next();
    }

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