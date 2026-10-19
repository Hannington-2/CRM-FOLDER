// SecurityLog.js
const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
    event: {
        type: String,
        enum: [
            'login_success',
            'login_failed',
            'login_locked',
            'logout',
            'register',
            'password_change',
            'password_reset_request',
            'password_reset_success',
            'account_locked',
            'suspicious_activity',
            'rate_limit_hit'
        ],
        required: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: String,           
    ip: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed,
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info'
    }
}, { timestamps: true });

// Auto-delete logs older than 90 days 
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);