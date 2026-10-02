// backend/src/models/PushSubscription.js
const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    userAgent: String,       // e.g. "Chrome on Android"
    deviceName: String,      // e.g. "Samsung Galaxy S21"
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);