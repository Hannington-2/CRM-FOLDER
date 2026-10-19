const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const User = require('../models/User');

router.use(authMiddleware);

// GET /api/notifications — get all for current user
router.get('/', async (req, res) => {
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
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
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
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
    try {
        await Notification.updateMany(
            {
                $or: [{ user: req.user.id }, { user: null }],
                isRead: false
            },
            { isRead: true, readAt: new Date() }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/notifications/clear-all
router.delete('/clear-all', async (req, res) => {
    try {
        await Notification.deleteMany({
            $or: [{ user: req.user.id }, { user: null }]
        });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/notifications — create (internal use)
router.post('/', async (req, res) => {
    try {
        const { userId, type, title, message, link, data } = req.body;
        let recipientId = null;
        if (userId) {
            const recipient = await User.findOne({
                _id: userId,
                organization: req.organization._id
            }).select('_id');
            if (!recipient) {
                return res.status(404).json({ message: 'Notification recipient not found' });
            }
            recipientId = recipient._id;
        }

        const notification = await Notification.create({
            organization: req.organization._id,
            user: recipientId,
            type,
            title,
            message,
            link,
            data
        });

        if (recipientId && global.sendNotificationToUser) {
            global.sendNotificationToUser(recipientId, notification);
        } else if (global.broadcastNotification) {
            global.broadcastNotification(notification, req.organization._id);
        }

        res.status(201).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;