// backend/src/controllers/notificationController.js
const Notification = require('../models/Notification');

// @desc    Get notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [{ user: req.user.id }, { user: null }]
        })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            $or: [{ user: req.user.id }, { user: null }],
            isRead: false
        });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark one as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const n = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!n) return res.status(404).json({ message: 'Notification not found' });
        res.json(n);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { $or: [{ user: req.user.id }, { user: null }], isRead: false },
            { isRead: true, readAt: new Date() }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Clear all
// @route   DELETE /api/notifications/clear-all
exports.clearAll = async (req, res) => {
    try {
        await Notification.deleteMany({
            $or: [{ user: req.user.id }, { user: null }]
        });
        res.json({ message: 'All cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create notification (used internally + for testing)
// @route   POST /api/notifications
exports.createNotification = async (req, res) => {
    try {
        const { userId, type, title, message, link, data } = req.body;

        const notification = await Notification.create({
            user: userId || null,
            type: type || 'system',
            title,
            message,
            link,
            data
        });

        // Send via socket if available
        if (userId && global.sendNotificationToUser) {
            global.sendNotificationToUser(userId, notification);
        } else if (global.broadcastNotification) {
            global.broadcastNotification(notification);
        }

        res.status(201).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a test notification for the current user
// @route   POST /api/notifications/test
exports.createTest = async (req, res) => {
    try {
        const notification = await Notification.create({
            user: req.user.id,
            type: 'system',
            title: '🔔 Test Notification',
            message: 'This is a test notification. Your bell is working!',
            link: '/dashboard'
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};