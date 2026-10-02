// backend/src/routes/pushRoutes.js
const express = require('express');
const router = express.Router();
const {
    getVapidKey,
    subscribe,
    unsubscribe,
    getMySubscriptions,
    removeSubscription,
    sendTest
} = require('../controllers/pushController');
const authMiddleware = require('../middleware/authMiddleware');

// Public — frontend needs the key to subscribe
router.get('/vapid-key', getVapidKey);

// Protected
router.use(authMiddleware);

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/subscriptions', getMySubscriptions);
router.delete('/subscriptions/:id', removeSubscription);
router.post('/test', sendTest);

module.exports = router;