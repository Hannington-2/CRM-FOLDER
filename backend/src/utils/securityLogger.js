// backend/src/utils/securityLogger.js
const SecurityLog = require('../models/SecurityLog');

/**
 * Log a security event.
 */
exports.logSecurity = async ({
    event,
    user = null,
    email = null,
    ip = null,
    userAgent = null,
    details = {},
    severity = 'info'
}) => {
    try {
        await SecurityLog.create({
            event, user, email, ip, userAgent, details, severity
        });
    } catch (err) {
        console.error('Security log failed:', err.message);
    }
};