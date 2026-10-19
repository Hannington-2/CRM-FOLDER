// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('../models/Organization');   // ← ADD THIS LINE (registers the model for populate)
const { runWithOrganization } = require('../utils/organizationContext');

const AUTH_COOKIE_NAME = 'nf_token';

module.exports = async function (req, res, next) {
    let token = req.cookies?.[AUTH_COOKIE_NAME];

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

        const user = await User.findById(decoded.id)
            .setOptions({ organizationScopeBypass: true })
            .select('organization role name email')
            .populate('organization', 'name slug type');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!user.organization) {
            return res.status(403).json({ message: 'No organization assigned' });
        }

        const organizationId = user.organization._id;
        if (decoded.organization && String(decoded.organization) !== String(organizationId)) {
            return res.status(401).json({ message: 'Session organization has changed' });
        }

        req.user.organization = organizationId;
        req.organization = user.organization;

        runWithOrganization(organizationId, next);
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};