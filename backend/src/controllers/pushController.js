// backend/src/controllers/pushController.js
const PushSubscription = require('../models/PushSubscription');
const { sendPushToUser, sendPushToAllStaff } = require('../services/webPushService');

// @desc    Get VAPID public key for frontend
// @route   GET /api/push/vapid-key
exports.getVapidKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// @desc    Subscribe to push notifications
// @route   POST /api/push/subscribe
exports.subscribe = async (req, res) => {
    try {
        const { endpoint, keys, deviceName, userAgent } = req.body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ message: 'Invalid subscription data' });
        }

        // Upsert: if endpoint exists, update; else create
        const subscription = await PushSubscription.findOneAndUpdate(
            { endpoint },
            {
                user: req.user.id,
                endpoint,
                keys,
                deviceName: deviceName || 'Unknown Device',
                userAgent: userAgent || req.headers['user-agent'] || '',
                isActive: true,
                lastUsedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Push subscription saved for user ${req.user.id} — ${deviceName}`);
        res.status(201).json({ message: 'Subscribed', subscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Unsubscribe a device
// @route   POST /api/push/unsubscribe
exports.unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) {
            await PushSubscription.findOneAndDelete({
                user: req.user.id,
                endpoint
            });
        }
        res.json({ message: 'Unsubscribed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get my subscriptions (my devices)
// @route   GET /api/push/subscriptions
exports.getMySubscriptions = async (req, res) => {
    try {
        const subscriptions = await PushSubscription.find({
            user: req.user.id,
            isActive: true
        }).sort({ lastUsedAt: -1 });
        res.json(subscriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove a specific device
// @route   DELETE /api/push/subscriptions/:id
exports.removeSubscription = async (req, res) => {
    try {
        await PushSubscription.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });
        res.json({ message: 'Device removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Send a test push to yourself
// @route   POST /api/push/test
exports.sendTest = async (req, res) => {
    try {
        const result = await sendPushToUser(req.user.id, {
            title: ' Test Notification',
            body: 'If you see this, push notifications are working!',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-96.png',
            tag: 'test-notification',
            url: '/dashboard',
            timestamp: Date.now()
        });
        res.json({
            message: `Test sent to ${result.sent} of ${result.total} device(s)`,
            result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};