// backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createNotification,
    createTest
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/', createNotification);
router.post('/test', createTest);
router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAll);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;