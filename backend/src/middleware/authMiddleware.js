// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const AUTH_COOKIE_NAME = 'nf_token';

module.exports = function (req, res, next) {
    // 1. Prefer cookie (new secure way)
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    // 2. Fallback to Authorization header (for backwards compat / API tools)
    if (!token) {
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};