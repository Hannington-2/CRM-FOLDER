// backend/src/utils/notify.js
const Notification = require('../models/Notification');
const { sendPushToAllStaff } = require('../services/webPushService');

/**
 * Create a notification and deliver it via:
 *   1. Save to MongoDB (for history/bell dropdown)
 *   2. Socket.IO broadcast (for users with app open)
 *   3. Web Push to all staff devices (for closed app)
 *
 * @param {Object} opts
 * @param {string|null} opts.userId - recipient user ID, or null for broadcast to all
 * @param {string} opts.type - 'invoice_created' | 'payment_received' | 'receipt_generated' | 'client_added' | 'invoice_overdue' | 'system'
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.link] - frontend URL to navigate to on click
 * @param {Object} [opts.data] - extra payload
 */
const notify = async ({ userId = null, type, title, message, link, data }) => {
    try {
        // 1. Save to DB
        const notification = await Notification.create({
            user: userId,
            type,
            title,
            message,
            link,
            data
        });

        // 2. Socket.IO — instant, only if app is open
        if (userId && global.sendNotificationToUser) {
            global.sendNotificationToUser(userId, notification);
        } else if (global.broadcastNotification) {
            global.broadcastNotification(notification);
        }

        // 3. Web Push — works even when app is closed / logged out
        try {
            const result = await sendPushToAllStaff({
                title,
                body: message,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-96.png',
                tag: type,
                url: link || '/dashboard',
                notificationId: notification._id
            });
            console.log(`🔔 Push sent: ${result.sent}/${result.total} devices — ${title}`);
        } catch (pushErr) {
            // Don't fail the whole operation if push fails
            console.error('Push send failed (non-fatal):', pushErr.message);
        }

        return notification;
    } catch (err) {
        console.error('notify() failed:', err.message);
        return null;
    }
};

module.exports = notify;