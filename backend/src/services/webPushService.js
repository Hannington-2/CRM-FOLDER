// backend/src/services/webPushService.js
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@forensicsnbi.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a single subscription.
 * Returns true if sent, false if subscription expired.
 */
const sendPushToSubscription = async (subscription, payload) => {
    try {
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: subscription.keys
            },
            JSON.stringify(payload)
        );
        return true;
    } catch (err) {
        // 404 or 410 = subscription expired / unsubscribed
        if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('🗑️ Expired subscription, removing:', subscription.endpoint);
            await PushSubscription.findByIdAndDelete(subscription._id);
        } else {
            console.error('❌ Push send failed:', err.message);
        }
        return false;
    }
};

/**
 * Send a push notification to ALL devices of a specific user.
 */
const sendPushToUser = async (userId, payload) => {
    const subscriptions = await PushSubscription.find({ user: userId, isActive: true });
    console.log(`📤 Sending push to ${subscriptions.length} device(s) of user ${userId}`);

    const results = await Promise.allSettled(
        subscriptions.map(sub => sendPushToSubscription(sub, payload))
    );

    const sent = results.filter(r => r.value === true).length;
    return { sent, total: subscriptions.length };
};

/**
 * Send a push notification to ALL staff (all users).
 */
const sendPushToAllStaff = async (payload) => {
    const subscriptions = await PushSubscription.find({ isActive: true });
    console.log(`📢 Broadcasting push to ${subscriptions.length} device(s)`);

    const results = await Promise.allSettled(
        subscriptions.map(sub => sendPushToSubscription(sub, payload))
    );

    const sent = results.filter(r => r.value === true).length;
    return { sent, total: subscriptions.length };
};

module.exports = {
    webpush,
    sendPushToSubscription,
    sendPushToUser,
    sendPushToAllStaff
};