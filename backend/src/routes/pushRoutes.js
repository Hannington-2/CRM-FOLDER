const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const PushSubscription = require('../models/PushSubscription');

// Public — frontend needs the VAPID key before subscribing
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

router.use(authMiddleware);

// POST /api/push/subscribe
router.post('/subscribe', async (req, res) => {
    try {
        const { endpoint, keys, deviceName, userAgent } = req.body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ message: 'Invalid subscription data' });
        }

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

        res.status(201).json({ message: 'Subscribed', subscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/push/unsubscribe
router.post('/unsubscribe', async (req, res) => {
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
});

// GET /api/push/subscriptions
router.get('/subscriptions', async (req, res) => {
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
});

// DELETE /api/push/subscriptions/:id
router.delete('/subscriptions/:id', async (req, res) => {
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
});

// POST /api/push/test
router.post('/test', async (req, res) => {
    try {
        const { sendPushToUser } = require('../services/webPushService');
        const result = await sendPushToUser(req.user.id, {
            title: '🔔 Test Notification',
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
});

module.exports = router;